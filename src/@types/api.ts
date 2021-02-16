import { ValidMetrics, AppQueue } from './app'

export interface GetQueues<JobOpts, AddProps> {
  stats: Partial<ValidMetrics>
  queues: AppQueue<JobOpts, AddProps>[]
}
