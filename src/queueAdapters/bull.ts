import { Job, Queue } from 'bull'
import {
  JobCleanStatus,
  JobCounts,
  JobStatus,
  QueueAdapter,
  QueueAdapterOptions,
} from '../@types/app'
import { routerFactory } from './routerFactory'

export class BullAdapter implements QueueAdapter<Job> {
  public readonly readOnlyMode: boolean

  public get client(): Promise<Queue['client']> {
    return Promise.resolve(this.queue.client)
  }

  constructor(public queue: Queue, options: Partial<QueueAdapterOptions> = {}) {
    this.readOnlyMode = options.readOnlyMode === true
  }

  public getName(): string {
    return this.queue.name
  }

  public clean(jobStatus: JobCleanStatus, graceTimeMs: number): Promise<any> {
    return this.queue.clean(graceTimeMs, jobStatus as any)
  }

  public getJob(id: string): Promise<Job | undefined | null> {
    return this.queue.getJob(id)
  }

  public getJobs(
    jobStatuses: JobStatus[],
    start?: number,
    end?: number,
  ): Promise<Job[]> {
    return this.queue.getJobs(jobStatuses as any, start, end)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getJobCounts(..._jobStatuses: JobStatus[]): Promise<JobCounts> {
    return (this.queue.getJobCounts() as unknown) as Promise<JobCounts>
  }
}

// TODO: Make this better ...
const bullRouter = routerFactory()

export const replaceQueues = bullRouter.replaceQueues
export const setQueues = bullRouter.setQueues
const router = bullRouter.router

export { router }
