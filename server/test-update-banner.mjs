import 'dotenv/config'
import { updateBanner } from './siteDataService.js'

async function test() {
  try {
    const res = await updateBanner(4, { title: 'Teste update direct' })
    console.log('updateBanner result ->', res)
  } catch (err) {
    console.error('updateBanner error ->', err)
  }
}

test()
