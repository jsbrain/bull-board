import express from 'express'
import { ParamsDictionary, RequestHandler } from 'express-serve-static-core'
import path from 'path'
import { BullBoardQueues, QueueAdapter } from '../@types/app'
import { entryPoint } from '../routes'
import { cleanAll } from '../routes/cleanAll'
import { cleanJob } from '../routes/cleanJob'
import { errorHandler } from '../routes/errorHandler'
import { promoteJob } from '../routes/promoteJob'
import { queuesHandler } from '../routes/queues'
import { retryAll } from '../routes/retryAll'
import { retryJob } from '../routes/retryJob'

// TODO: Something like that ...
export const routerFactory = <Job>() => {
  const bullBoardQueues: BullBoardQueues<Job> = {}

  const wrapAsync = <Params extends ParamsDictionary>(
    fn: RequestHandler<Params>,
  ): RequestHandler<Params> => async (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next)

  const router = express()
  router.locals.bullBoardQueues = bullBoardQueues

  router.set('view engine', 'ejs')
  router.set('views', path.resolve(__dirname, '../dist/ui'))

  router.use('/static', express.static(path.resolve(__dirname, '../static')))

  router.get(['/', '/queue/:queueName'], entryPoint)
  router.get('/api/queues', wrapAsync(queuesHandler))
  router.put('/api/queues/:queueName/retry', wrapAsync(retryAll))
  router.put('/api/queues/:queueName/:id/retry', wrapAsync(retryJob))
  router.put('/api/queues/:queueName/:id/clean', wrapAsync(cleanJob))
  router.put('/api/queues/:queueName/:id/promote', wrapAsync(promoteJob))
  router.put('/api/queues/:queueName/clean/:queueStatus', wrapAsync(cleanAll))
  router.use(errorHandler)

  const setQueues = (bullQueues: ReadonlyArray<QueueAdapter<Job>>): void => {
    bullQueues.forEach((queue) => {
      const name = queue.getName()

      bullBoardQueues[name] = { queue }
    })
  }

  const replaceQueues = (
    bullQueues: ReadonlyArray<QueueAdapter<Job>>,
  ): void => {
    const queuesToPersist: string[] = bullQueues.map((queue) => queue.getName())

    Object.keys(bullBoardQueues).forEach((name) => {
      if (queuesToPersist.indexOf(name) === -1) {
        delete bullBoardQueues[name]
      }
    })

    return setQueues(bullQueues)
  }

  return {
    setQueues,
    replaceQueues,
    router,
  }
}
