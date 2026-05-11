import { redirect } from 'next/navigation'

// Root redirects to the library demo station — useful for dev and demo
export default function Home() {
  redirect('/station/PKU-LIB-01')
}
