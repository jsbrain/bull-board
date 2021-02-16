import { Job, Queue } from 'bullmq'
import {
  JobCleanStatus,
  JobCounts,
  JobStatus,
  QueueAdapter,
  QueueAdapterOptions,
} from '../@types/app'

// TODO: This should be injected into the AppJob type so those props will only be present for bullmq lib
// * To use with AppJob type
type AdditionalBullProps = {
  progress: Job['progress']
  attempts: Job['attemptsMade']
  failedReason: Job['failedReason']
  data: Job['data']
  name: Job['name']
}

export class BullMQAdapter implements QueueAdapter<Job> {
  public readonly readOnlyMode: boolean
  private readonly LIMIT = 1000

  public get client(): Queue['client'] {
    return this.queue.client
  }

  constructor(
    private queue: Queue,
    options: Partial<QueueAdapterOptions> = {},
  ) {
    this.readOnlyMode = options.readOnlyMode === true
  }

  public getName(): string {
    return this.queue.toKey('~')
  }

  public clean(jobStatus: JobCleanStatus, graceTimeMs: number): Promise<void> {
    return this.queue.clean(graceTimeMs, this.LIMIT, jobStatus)
  }

  public getJob(id: string): Promise<Job | undefined> {
    return this.queue.getJob(id)
  }

  public getJobs(
    jobStatuses: JobStatus[],
    start?: number,
    end?: number,
  ): Promise<Job[]> {
    return this.queue.getJobs(jobStatuses, start, end)
  }

  public getJobCounts(...jobStatuses: JobStatus[]): Promise<JobCounts> {
    return (this.queue.getJobCounts(
      ...jobStatuses,
    ) as unknown) as Promise<JobCounts>
  }
}
