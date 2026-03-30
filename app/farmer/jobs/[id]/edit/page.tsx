"use client"

import { FarmerJobForm } from "@/components/farmer/farmer-job-form"
import { useParams } from "next/navigation"

export default function EditJobPage() {
  const params = useParams<{ id: string }>()
  const jobId = Array.isArray(params?.id) ? params.id[0] : params?.id

  return <FarmerJobForm mode="edit" jobId={jobId} />
}
