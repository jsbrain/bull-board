declare module '*.css' {
  const resource: Record<string, string>
  export = resource
}

// Use to be able to inherit actual JobOptions type from Job by using index
// e.g. Job['opts'] => JobOptions | JobsOptions, depending on import from 'bull' or 'bullmq'
type JobOptionsObj = { opts: Record<string, any> }
