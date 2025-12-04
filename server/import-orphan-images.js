import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const galleryDir = path.join(__dirname, '../public/images/gallery')

async function importOrphanImages() {
  try {
    // Get all files in gallery directory
    const files = fs.readdirSync(galleryDir)
    
    // Get all images already in database
    const [dbImages] = await pool.execute('SELECT image FROM gallery_items')
    const dbImagePaths = new Set(dbImages.map(row => row.image))
    
    // Filter orphan files (exist in disk but not in database)
    const orphanFiles = files.filter(file => {
      const imagePath = `/images/gallery/${file}`
      return !dbImagePaths.has(imagePath) && /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
    })
    
    console.log(`Found ${orphanFiles.length} orphan images`)
    
    if (orphanFiles.length === 0) {
      console.log('No orphan images to import')
      process.exit(0)
    }
    
    // Ask for title, description and category
    console.log('\nPlease enter the following information for these images:')
    const title = 'Holywins - 2022'
    const description = 'Holywins - 2022'
    const category = '2022'
    
    console.log(`\nTitle: ${title}`)
    console.log(`Description: ${description}`)
    console.log(`Category: ${category}`)
    console.log(`\nImporting ${orphanFiles.length} images...`)
    
    // Insert each orphan image
    for (const file of orphanFiles) {
      const imagePath = `/images/gallery/${file}`
      await pool.execute(
        'INSERT INTO gallery_items (title, description, image, category) VALUES (?, ?, ?, ?)',
        [title, description, imagePath, category]
      )
      console.log(`✓ Imported: ${file}`)
    }
    
    console.log(`\n✓ Successfully imported ${orphanFiles.length} images!`)
    process.exit(0)
  } catch (error) {
    console.error('Error importing orphan images:', error)
    process.exit(1)
  }
}

importOrphanImages()
