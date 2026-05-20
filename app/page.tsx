"use client"
import ExploreSection from "@/components/home/explore-section"
import PageContent from "@/components/layout/page-content"

export default function Home() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div className="pointer-events-auto">
        <PageContent>
          <ExploreSection />
        </PageContent>
      </div>
    </div>
  )
}
