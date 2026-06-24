import { db } from '../src/lib/db'

async function main() {
  const edges = await db.flowEdge.findMany({
    select: { id: true, sourceNodeId: true, targetNodeId: true, label: true, condition: true },
  })
  console.log(JSON.stringify(edges, null, 2))
  await db.$disconnect()
}
main().catch(console.error)
