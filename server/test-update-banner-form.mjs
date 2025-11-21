import 'dotenv/config'
import fs from 'fs'
import FormData from 'form-data'
import fetch from 'node-fetch'

async function test() {
  const fd = new FormData()
  fd.append('title', 'Teste via form')
  fd.append('link', 'https://teste.example')
  // note: file optional - we will not upload

  const res = await fetch('http://localhost:4000/api/banners/4', {
    method: 'PUT',
    body: fd,
  })
  const text = await res.text()
  console.log('status', res.status)
  console.log('text', text)
}

test().catch(console.error)
