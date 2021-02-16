// import { Job } from 'bull'
// import { Job as JobMq } from 'bullmq'
import { Request, RequestHandler, Response } from 'express-serve-static-core'
import { parse as parseRedisInfo } from 'redis-info'

import * as api from '../@types/api'
import * as app from '../@types/app'
import { JobStatus } from '../@types/app'
import { Status } from '../ui/components/constants'

type MetricName = keyof app.ValidMetrics

const metrics: MetricName[] = [
  'redis_version',
  'used_memory',
  'mem_fragmentation_ratio',
  'connected_clients',
  'blocked_clients',
]

const getStats = async <Job>({
  queue,
}: app.BullBoardQueue<Job>): Promise<app.ValidMetrics> => {
  const redisClient = await queue.client
  const redisInfoRaw = await redisClient.info()
  const redisInfo = parseRedisInfo(redisInfoRaw)

  const validMetrics = metrics.reduce((acc, metric) => {
    if (redisInfo[metric]) {
      acc[metric] = redisInfo[metric]
    }

    return acc
  }, {} as Record<MetricName, string>)

  validMetrics.total_system_memory =
    redisInfo.total_system_memory || redisInfo.maxmemory

  return validMetrics
}

const formatJob = <Job extends JobMock, AddProps>(
  job: Job,
): app.AppJob<Job['opts'], AddProps> => {
  const jobProps: ReturnType<Job['toJSON']> = job.toJSON()

  // TODO: Should be improved to return actual present values only ...
  return ({
    id: jobProps.id,
    timestamp: jobProps.timestamp,
    processedOn: jobProps.processedOn,
    finishedOn: jobProps.finishedOn,
    progress: jobProps.progress,
    attempts: jobProps.attemptsMade,
    delay: job.opts.delay,
    failedReason: jobProps.failedReason,
    stacktrace: jobProps.stacktrace,
    opts: jobProps.opts,
    data: jobProps.data,
    name: jobProps.name,
    returnValue: jobProps.returnvalue,
  } as unknown) as app.AppJob<Job['opts'], AddProps>
}

const statuses: JobStatus[] = [
  'active',
  'completed',
  'delayed',
  'failed',
  'paused',
  'waiting',
]

const getDataForQueues = async <Job extends JobMock, AddProps>(
  bullBoardQueues: app.BullBoardQueues<Job>,
  req: Request,
): Promise<api.GetQueues<Job['opts'], AddProps>> => {
  const query = req.query || {}
  const pairs = Object.entries(bullBoardQueues)

  if (pairs.length == 0) {
    return {
      stats: {},
      queues: [],
    }
  }

  const queues: app.AppQueue<Job['opts'], AddProps>[] = (await Promise.all(
    pairs.map(async ([name, { queue }]) => {
      const counts = await queue.getJobCounts(...statuses)
      const status =
        query[name] === 'latest' ? statuses : (query[name] as JobStatus[])
      const jobs = await queue.getJobs(status, 0, 10)

      return {
        name,
        counts: counts as Record<Status, number>,
        jobs: jobs.map(formatJob),
        readOnlyMode: queue.readOnlyMode,
      }
    }),
  )) as app.AppQueue<Job['opts'], AddProps>[]

  const stats = await getStats(pairs[0][1])

  return {
    stats,
    queues,
  }
}

export const queuesHandler: RequestHandler = async (
  req: Request,
  res: Response,
) => {
  const { bullBoardQueues } = req.app.locals

  res.json(await getDataForQueues(bullBoardQueues, req))
}
