import { type BeehiivPost } from "@/lib/beehiiv"
import IssueCard from "./issue-card"

export default function IssueList({ posts }: { posts: BeehiivPost[] }) {
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {posts.map((post) => (
        <li key={post.id}>
          <IssueCard post={post} />
        </li>
      ))}
    </ul>
  )
}
