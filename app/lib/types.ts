// app/lib/types.ts
export interface Design {
  url: string
  revised_prompt?: string
}

export interface DesignResponse {
  designs: Design[]
}

export interface SubmitDesignData {
  description: string
  referenceImage: string | null
}

export interface ApiError {
  error: string
}