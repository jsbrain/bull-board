// import { Job, JobOptions } from 'bull'
// import { Job as JobMq, JobsOptions } from 'bullmq'
import React from 'react'
import * as Redis from 'ioredis'
import { Status } from '../ui/components/constants'

export type JobCleanStatus =
  | 'completed'
  | 'wait'
  | 'active'
  | 'delayed'
  | 'failed'

export type JobStatus = Status

export type JobCounts = Record<JobStatus, number>

export interface QueueAdapter<BullJob> {
  readonly client: Promise<Redis.Redis>
  readonly readOnlyMode: boolean

  getName(): string

  getJob(id: string): Promise<BullJob | undefined | null>

  getJobs(
    jobStatuses: JobStatus[],
    start?: number,
    end?: number,
  ): Promise<BullJob[]>

  getJobCounts(...jobStatuses: JobStatus[]): Promise<JobCounts>

  clean(queueStatus: JobCleanStatus, graceTimeMs: number): Promise<any>
}

export interface QueueAdapterOptions {
  readOnlyMode: boolean
}

export interface BullBoardQueue<BullJob> {
  queue: QueueAdapter<BullJob>
}

export interface BullBoardQueues<BullJob> {
  [key: string]: BullBoardQueue<BullJob>
}

export interface ValidMetrics {
  total_system_memory: string
  redis_version: string
  used_memory: string
  mem_fragmentation_ratio: string
  connected_clients: string
  blocked_clients: string
}

export type GenAppJob<JobOpts> = {
  id: string | number | undefined
  timestamp: number | null
  processedOn?: number | null
  finishedOn?: number | null
  stacktrace: string[] | null
  opts: JobOpts
  delay: number | undefined
  returnValue: string | Record<string | number, any> | null
}

// NOTE: The additional props type probably could be omitted, depending on the actual usage of the props
export type AppJob<JobOpts, AddProps> = AddProps extends Record<string, never>
  ? GenAppJob<JobOpts>
  : GenAppJob<JobOpts> & AddProps

export interface AppQueue<JobOpts, AddProps> {
  name: string
  counts: Record<Status, number>
  jobs: AppJob<JobOpts, AddProps>[]
  readOnlyMode: boolean
}

export type SelectedStatuses<JobOpts, AddProps> = Record<
  AppQueue<JobOpts, AddProps>['name'],
  Status
>

export interface QueueActions<JobOpts, AddProps> {
  promoteJob: (
    queueName: string,
  ) => (job: AppJob<JobOpts, AddProps>) => () => Promise<void>
  retryJob: (
    queueName: string,
  ) => (job: AppJob<JobOpts, AddProps>) => () => Promise<void>
  cleanJob: (
    queueName: string,
  ) => (job: AppJob<JobOpts, AddProps>) => () => Promise<void>
  retryAll: (queueName: string) => () => Promise<void>
  cleanAllDelayed: (queueName: string) => () => Promise<void>
  cleanAllFailed: (queueName: string) => () => Promise<void>
  cleanAllCompleted: (queueName: string) => () => Promise<void>
  setSelectedStatuses: React.Dispatch<
    React.SetStateAction<SelectedStatuses<JobOpts, AddProps>>
  >
}
