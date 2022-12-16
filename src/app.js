import { apib2DOT, apib2Insomnia, apib2Postman, openApi2DOT, openApi2Insomnia, openApi2Postman, swagger2DOT, swagger2Insomnia, swagger2Postman } from '@renerpires/doc2collection'
import express, { json, urlencoded } from 'express'
import fileUpload from 'express-fileupload'
import { readdirSync, rmSync, writeFileSync } from 'fs'
import * as p from 'path'
import { v4 as uuid } from 'uuid'
const app = express()
const port = process.env.PORT || 3000

app.use(json())
app.use(urlencoded({ extended: true }))
app.use(fileUpload({
  createParentPath: true,
  defCharset: 'utf8',
  defParamCharset: 'utf8'
}))

app.get('/', (req, res) => {
  res.send('GET METHOD')
})

// import { parse } from 'qs';
// app.settings('query parser', function (str) {
//  return parse(str, { query })})

app.post('/', async (req, res) => {
  readdirSync('./output').forEach(file => {
    rmSync(`./output/${file}`)
  })

  const { from, to } = req.query

  if (from === undefined) {
    res.status(400)
    res.send({ status: 'error', message: "'from' é um parâmetro obrigatório" })
    return
  }

  if (to === undefined) {
    res.status(400)
    res.send({ status: 'error', message: "'to' é um parâmetro obrigatório" })
    return
  }

  if (!['swagger', 'openapi', 'apiblueprint'].includes(from.toLowerCase())) {
    res.status(400)
    res.send({ status: 'error', message: "'from' precisa ser 'swagger', 'openapi' ou 'apiblueprint'." })
    return
  }

  if (!['postman', 'insomnia', 'dot'].includes(to.toLowerCase())) {
    res.status(400)
    res.send({ status: 'error', message: "'to' precisa ser 'postman', 'insomnia' ou 'dot'." })
    return
  }

  if (!req.files) {
    res.status(400)
    res.send({ status: 'error', message: 'Nenhum arquivo foi enviado' })
  } else {
    const document = req.files.document
    const extensionName = p.extname(document.name)
    const allowedExtensions = ['.json', '.apib', '.yml', '.yaml']

    if (!allowedExtensions.includes(extensionName)) {
      res.status(400)
      res.send({ status: 'error', message: "Arquivo precisa ser '.json', '.apib' ou 'yaml'" })
    } else {
      const documentName = uuid() + extensionName
      await document.mv('./uploads/' + documentName)
      let dataOutput = ''

      if (to.toLowerCase() === 'insomnia') {
        switch (from.toLowerCase()) {
          case 'apiblueprint':
            dataOutput = await apib2Insomnia(p.resolve('./uploads/' + documentName))
            break

          case 'openapi':
            dataOutput = await openApi2Insomnia(p.resolve('./uploads/' + documentName))
            break

          case 'swagger':
            dataOutput = await swagger2Insomnia(p.resolve('./uploads/' + documentName))
            break
        }
      } else {
        if (to.toLowerCase() === 'postman') {
          switch (from.toLowerCase()) {
            case 'apiblueprint':
              dataOutput = await apib2Postman(p.resolve('./uploads/' + documentName))
              break

            case 'openapi':
              dataOutput = await openApi2Postman(p.resolve('./uploads/' + documentName))
              break

            case 'swagger':
              dataOutput = await swagger2Postman(p.resolve('./uploads/' + documentName))
              break
          }
        } else {
          switch (from.toLowerCase()) {
            case 'apiblueprint':
              dataOutput = await apib2DOT(p.resolve('./uploads/' + documentName))
              break

            case 'openapi':
              dataOutput = await openApi2DOT(p.resolve('./uploads/' + documentName))
              break

            case 'swagger':
              dataOutput = await swagger2DOT(p.resolve('./uploads/' + documentName))
              break
          }
        }
      }

      writeFileSync(`./output/${documentName}.json`, dataOutput, { encoding: 'utf-8' })
      res.status(200)
      res.download(`./output/${documentName}.json`)
      // res.send({ status: 'success', message: 'Collection disponível em ...' })
    }
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
