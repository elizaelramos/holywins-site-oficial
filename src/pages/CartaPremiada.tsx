import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Copy, Download, FileText, Printer, Upload, X } from 'lucide-react'
import './CartaPremiada.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const IMAGEM = '/carta-premiada/carta-premiada-holywins-2026.jpg'
const MODELO_PDF = '/carta-premiada/carta-premiada-holywins-2026-modelo.pdf'
const WHATSAPP = '(67) 98105-8529'
const WHATSAPP_LINK = 'https://wa.me/5567981058529'
const MAX_ARQUIVOS = 4
const MAX_TAMANHO = 10 * 1024 * 1024
const TIPOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

const passos = [
  { titulo: 'Escolha', texto: 'um(a) santo(a). Seja criativo e capriche nos detalhes!' },
  { titulo: 'Conheça', texto: 'a vida dele(a): pesquise a história do(a) seu(sua) novo(a) amigo(a) no céu.' },
  { titulo: 'Escreva', texto: 'a carta contando por que você o(a) escolheu e o que mais chamou a sua atenção. Pode ser em qualquer papel, e pode desenhar!' },
  { titulo: 'Entregue', texto: 'até 31/10/2026 na urna da Paróquia São João Bosco, pelo WhatsApp ou aqui pelo site. Coloque nome, telefone e paróquia.' },
  { titulo: 'A melhor carta', texto: 'escolhida pela comissão organizadora, será revelada no Holywins, dia 1º de novembro.' },
]

type Anexo = { id: number; file: File; preview: string | null }
type Resultado = { protocolo: string; nome: string; santo: string | null; createdAt: string; arquivos: number }

function formatarTamanho(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function CartaPremiada() {
  const [nome, setNome] = useState('')
  const [idade, setIdade] = useState('')
  const [telefone, setTelefone] = useState('')
  const [paroquia, setParoquia] = useState('')
  const [santo, setSanto] = useState('')
  const [anexos, setAnexos] = useState<Anexo[]>([])
  const [arrastando, setArrastando] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [progresso, setProgresso] = useState<number | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [abertas, setAbertas] = useState(true)
  const proximoId = useRef(1)
  const inputRef = useRef<HTMLInputElement>(null)
  const anexosRef = useRef<Anexo[]>([])
  const enviando = progresso !== null

  useEffect(() => { anexosRef.current = anexos }, [anexos])

  useEffect(() => {
    const controller = new AbortController()
    fetch(API_URL + '/cartas-premiadas/status', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setAbertas(data.abertas === true) })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  // Libera as prévias das imagens ao sair da página
  useEffect(() => () => anexosRef.current.forEach((a) => a.preview && URL.revokeObjectURL(a.preview)), [])

  function adicionarArquivos(lista: FileList | File[]) {
    setErrorMsg('')
    const novos: Anexo[] = []
    const problemas: string[] = []
    for (const file of Array.from(lista)) {
      if (!TIPOS_ACEITOS.includes(file.type)) {
        problemas.push(`"${file.name}" não é PDF nem imagem (JPG, PNG ou WEBP).`)
      } else if (file.size > MAX_TAMANHO) {
        problemas.push(`"${file.name}" passa de 10 MB.`)
      } else {
        novos.push({ id: proximoId.current++, file, preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null })
      }
    }
    const vagas = MAX_ARQUIVOS - anexos.length
    if (novos.length > vagas) {
      problemas.push(`Você pode enviar no máximo ${MAX_ARQUIVOS} arquivos.`)
      novos.splice(vagas).forEach((a) => a.preview && URL.revokeObjectURL(a.preview))
    }
    if (novos.length) setAnexos((atual) => [...atual, ...novos])
    if (problemas.length) setErrorMsg(problemas.join(' '))
  }

  function removerAnexo(id: number) {
    setAnexos((atual) => {
      const alvo = atual.find((a) => a.id === id)
      if (alvo?.preview) URL.revokeObjectURL(alvo.preview)
      return atual.filter((a) => a.id !== id)
    })
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) adicionarArquivos(event.target.files)
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setArrastando(false)
    if (!enviando && event.dataTransfer.files.length) adicionarArquivos(event.dataTransfer.files)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (enviando) return
    setErrorMsg('')
    if (!nome.trim() || !telefone.trim() || !paroquia.trim()) {
      setErrorMsg('Preencha nome, telefone e paróquia / comunidade.')
      return
    }
    if (idade !== '' && (!Number.isInteger(Number(idade)) || Number(idade) < 0 || Number(idade) > 120)) {
      setErrorMsg('Informe uma idade entre 0 e 120 anos.')
      return
    }
    if (!anexos.length) {
      setErrorMsg('Anexe a foto ou o PDF da sua carta.')
      return
    }

    const form = new FormData()
    form.append('nome', nome.trim())
    form.append('idade', idade)
    form.append('telefone', telefone.trim())
    form.append('paroquia', paroquia.trim())
    form.append('santo', santo.trim())
    anexos.forEach((a) => form.append('arquivos', a.file))

    // XMLHttpRequest para mostrar o progresso do envio (fotos de celular podem ser grandes)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', API_URL + '/cartas-premiadas')
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgresso(Math.round((e.loaded / e.total) * 100)) }
    xhr.onload = () => {
      setProgresso(null)
      let data: { protocolo?: string; errors?: string[]; message?: string } | null = null
      try { data = JSON.parse(xhr.responseText) } catch { /* resposta vazia */ }
      if (xhr.status === 201 && data?.protocolo) {
        setResultado(data as Resultado)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      setErrorMsg(
        data?.errors?.join(' · ') || data?.message ||
        (xhr.status === 413 ? 'Os arquivos são grandes demais. Tente fotos menores.' : 'Não foi possível enviar a carta. Tente novamente.'),
      )
    }
    xhr.onerror = () => {
      setProgresso(null)
      setErrorMsg('Não foi possível enviar. Confira sua conexão e tente novamente.')
    }
    setProgresso(0)
    xhr.send(form)
  }

  async function copiarProtocolo() {
    if (!resultado) return
    try {
      await navigator.clipboard.writeText(resultado.protocolo)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2500)
    } catch { /* sem permissão para a área de transferência */ }
  }

  if (resultado) {
    return (
      <section className="carta-pagina carta-sucesso" aria-live="polite">
        <div className="carta-sucesso__icone"><Check size={36} aria-hidden="true" /></div>
        <h1>Carta recebida!</h1>
        <p>Obrigado por participar da Carta Premiada, {resultado.nome.split(' ')[0]}! Guarde o seu protocolo de entrega.</p>
        <div className="carta-protocolo">
          <span>Protocolo de entrega</span>
          <strong>{resultado.protocolo}</strong>
          <small>
            Recebida em {new Date(resultado.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
            {' · '}{resultado.arquivos} arquivo(s)
            {resultado.santo ? <> · Santo(a): {resultado.santo}</> : null}
          </small>
        </div>
        <p>A melhor carta será revelada no Holywins, dia <strong>1º de novembro</strong>.</p>
        <div className="carta-sucesso__acoes">
          <button type="button" className="ghost-btn" onClick={copiarProtocolo}>
            {copiado ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
            {copiado ? 'Copiado!' : 'Copiar protocolo'}
          </button>
          <button type="button" className="ghost-btn" onClick={() => window.print()}>
            <Printer size={18} aria-hidden="true" /> Imprimir comprovante
          </button>
          <Link to="/" className="primary-btn">Voltar ao início</Link>
        </div>
      </section>
    )
  }

  return (
    <div className="carta-pagina">
      <Link to="/" className="carta-voltar"><ArrowLeft size={18} aria-hidden="true" /> Voltar</Link>

      <header className="carta-hero">
        <img src={IMAGEM} alt="Criança escrevendo uma carta enquanto um santo a observa de uma nuvem" className="carta-hero__imagem" />
        <div className="carta-hero__texto">
          <p className="eyebrow">Holywins 2026</p>
          <h1><span>Carta</span> <span className="carta-destaque">Premiada</span></h1>
          <p>Escreva uma cartinha sobre um santo e ganhe um amigo no céu!</p>
          <p className="carta-prazo">Entregue até <strong>31/10/2026</strong></p>
        </div>
      </header>

      <section className="carta-card">
        <h2>Como participar</h2>
        <ol className="carta-passos">
          {passos.map((passo) => (
            <li key={passo.titulo}><strong>{passo.titulo}</strong> {passo.texto}</li>
          ))}
        </ol>
      </section>

      <section className="carta-card carta-modelo">
        <FileText size={40} aria-hidden="true" className="carta-modelo__icone" />
        <div>
          <h2>Baixe o modelo da carta</h2>
          <p>Imprima a folha, escreva e desenhe à vontade. O modelo não é obrigatório: a carta pode ser escrita em qualquer papel. Toda carta é bem-vinda!</p>
        </div>
        <a href={MODELO_PDF} download className="primary-btn"><Download size={18} aria-hidden="true" /> Baixar modelo (PDF)</a>
      </section>

      <section className="carta-card">
        <h2>Envie a sua carta pelo site</h2>
        <p>Tire uma foto bem nítida da carta (frente e verso, se tiver) ou envie o arquivo em PDF. Ao enviar, você recebe um <strong>protocolo de entrega</strong>.</p>
        {!abertas && <p className="carta-aviso" role="status">O prazo para envio das cartas foi encerrado. Obrigado a todos que participaram!</p>}

        <form onSubmit={handleSubmit} noValidate>
          <fieldset disabled={enviando || !abertas} className="carta-campos">
            <legend className="sr-only">Dados de quem escreveu a carta</legend>
            <label className="carta-campo--largo">Nome de quem escreveu *
              <input autoComplete="name" maxLength={255} value={nome} onChange={(e) => setNome(e.target.value)} required />
            </label>
            <label>Idade
              <input type="number" inputMode="numeric" min="0" max="120" step="1" value={idade} onChange={(e) => setIdade(e.target.value)} />
            </label>
            <label>Telefone / WhatsApp *
              <input type="tel" autoComplete="tel" maxLength={40} value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
            </label>
            <label className="carta-campo--largo">Paróquia / comunidade *
              <input maxLength={255} value={paroquia} onChange={(e) => setParoquia(e.target.value)} required />
            </label>
            <label className="carta-campo--largo">Santo(a) escolhido(a)
              <input maxLength={255} value={santo} onChange={(e) => setSanto(e.target.value)} />
            </label>

            <div className="carta-campo--largo">
              <span className="carta-rotulo" id="carta-arquivos-rotulo">Sua carta (PDF ou foto) *</span>
              <div
                className={`carta-upload ${arrastando ? 'carta-upload--ativo' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setArrastando(true) }}
                onDragLeave={() => setArrastando(false)}
                onDrop={handleDrop}
              >
                <Upload size={28} aria-hidden="true" />
                <p>Arraste os arquivos aqui ou</p>
                <button type="button" className="ghost-btn" onClick={() => inputRef.current?.click()} disabled={anexos.length >= MAX_ARQUIVOS} aria-describedby="carta-arquivos-rotulo carta-arquivos-ajuda">
                  Escolher arquivos
                </button>
                <small id="carta-arquivos-ajuda">Até {MAX_ARQUIVOS} arquivos · PDF, JPG, PNG ou WEBP · máx. 10 MB cada</small>
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={handleInput}
                />
              </div>

              {anexos.length > 0 && (
                <ul className="carta-anexos">
                  {anexos.map((a, i) => (
                    <li key={a.id}>
                      {a.preview
                        ? <img src={a.preview} alt={`Prévia da página ${i + 1}`} />
                        : <span className="carta-anexos__pdf"><FileText size={28} aria-hidden="true" /></span>}
                      <span className="carta-anexos__nome">{a.file.name}<small>{formatarTamanho(a.file.size)}</small></span>
                      <button type="button" className="carta-anexos__remover" onClick={() => removerAnexo(a.id)} aria-label={`Remover ${a.file.name}`}>
                        <X size={20} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {errorMsg && <p className="carta-erro carta-campo--largo" role="alert">{errorMsg}</p>}

            <div className="carta-campo--largo carta-enviar">
              <button type="submit" className="primary-btn">
                {enviando ? `Enviando... ${progresso}%` : 'Enviar minha carta'}
              </button>
              {enviando && <progress max={100} value={progresso ?? 0} aria-label="Progresso do envio" />}
            </div>
          </fieldset>
        </form>
      </section>

      <section className="carta-card">
        <h2>Prefere entregar de outro jeito?</h2>
        <div className="carta-entregas">
          <div><strong>Na urna</strong><span>Paróquia São João Bosco</span></div>
          <div><strong>Foto pelo WhatsApp</strong><a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">{WHATSAPP}</a></div>
          <div><strong>Pelo site</strong><span>Aqui mesmo, no formulário acima</span></div>
        </div>
      </section>
    </div>
  )
}
