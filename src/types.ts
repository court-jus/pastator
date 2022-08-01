export interface TourStep {
  target: string
  content: string
}

export interface Tour {
  steps: TourStep[]
  callbacks: Record<string, (() => void) | undefined>
}
