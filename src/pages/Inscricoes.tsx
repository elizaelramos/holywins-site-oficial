import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Check } from 'lucide-react'
import './Inscricoes.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
type Pessoa = { id: number; nome: string; idade: string; restricaoAlimentar: string; participaDesfile: boolean }
const novaPessoa = (id: number): Pessoa => ({ id, nome: '', idade: '', restricaoAlimentar: '', participaDesfile: false })

export default function Inscricoes({ embedded = false }: { embedded?: boolean }) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [paroquia, setParoquia] = useState('')
  const [vouParticipar, setVouParticipar] = useState(true)
  const [eu, setEu] = useState<Pessoa>(novaPessoa(0))
  const [acompanhantes, setAcompanhantes] = useState<Pessoa[]>([])
  const proximoId = useRef(1)
  const enviando = useRef(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultado, setResultado] = useState<{ codigo: string; email: string; nomes: string[] } | null>(null)
  const [inscricoesAbertas, setInscricoesAbertas] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    fetch(API_URL + '/inscricoes/status', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('Falha ao consultar inscrições')
        const data = await res.json()
        setInscricoesAbertas(data.abertas === true)
      })
      .catch(() => {
        if (!controller.signal.aborted) setErrorMsg('Não foi possível consultar as inscrições. Atualize a página para tentar novamente.')
      })
      .finally(() => { if (!controller.signal.aborted) setCarregando(false) })
    return () => controller.abort()
  }, [])
  const pessoas = [...(vouParticipar ? [{ ...eu, nome }] : []), ...acompanhantes]
  const total = pessoas.length
  const temCrianca = pessoas.some((p) => p.idade !== '' && Number(p.idade) >= 0 && Number(p.idade) <= 10)
  const temAdulto = pessoas.some((p) => p.nome.trim() && Number(p.idade) >= 18 && Number(p.idade) <= 120)
  const avisoAcompanhante = 'Crianças de até 10 anos precisam de um acompanhante adulto (18 anos ou mais) inscrito neste mesmo cadastro. Se você vai acompanhar, marque sua participação; se for outra pessoa, adicione o nome e a idade dela.'

  function adicionarPessoa() {
    const pessoa = novaPessoa(proximoId.current++)
    setAcompanhantes((pessoas) => [...pessoas, pessoa])
  }

  function detalhesPessoa(pessoa: Pessoa, atualizar: (patch: Partial<Pessoa>) => void) {
    return (
      <>
        <label>Idade *
          <input type="number" min="0" max="120" step="1" value={pessoa.idade} onChange={(e) => atualizar({ idade: e.target.value })} required />
          <small>Para menores de 1 ano, informe 0.</small>
        </label>
        <details className="inscricao-detalhes">
          <summary>Alimentação e desfile (opcional)</summary>
          <div className="inscricao-campos">
            <label>Restrição alimentar
              <input maxLength={255} value={pessoa.restricaoAlimentar} onChange={(e) => atualizar({ restricaoAlimentar: e.target.value })} />
            </label>
            <label className="inscricao-checkbox">
              <input type="checkbox" checked={pessoa.participaDesfile} onChange={(e) => atualizar({ participaDesfile: e.target.checked })} />
              Vai participar do desfile de santos
            </label>
          </div>
        </details>
      </>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (enviando.current) return
    setErrorMsg('')
    if (!inscricoesAbertas) {
      setErrorMsg('As inscrições ainda não estão abertas.')
      return
    }
    if (!nome.trim() || !telefone.trim() || pessoas.some((p) => !p.nome.trim())) {
      setErrorMsg('Preencha seu nome, telefone e o nome de quem vai participar.')
      return
    }
    if (!pessoas.length) {
      setErrorMsg('Adicione pelo menos uma pessoa que vai participar.')
      return
    }
    if (pessoas.some((p) => p.idade === '' || !Number.isInteger(Number(p.idade)) || Number(p.idade) < 0 || Number(p.idade) > 120)) {
      setErrorMsg('Informe a idade de cada participante, entre 0 e 120 anos.')
      return
    }
    if (temCrianca && !temAdulto) {
      setErrorMsg(avisoAcompanhante)
      return
    }
    enviando.current = true
    setSubmitting(true)
    try {
      const resp = await fetch(API_URL + '/inscricoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(), email: email.trim(), telefone: telefone.trim(), paroquia: paroquia.trim(),
          participantes: pessoas.map((p) => ({
            nome: p.nome.trim(), idade: p.idade === '' ? null : Number(p.idade),
            paroquia: paroquia.trim(), restricaoAlimentar: p.restricaoAlimentar.trim(),
            participaDesfile: p.participaDesfile, eResponsavel: p.id === 0,
            autorizaImagem: false,
          })),
        }),
      })
      const data = await resp.json().catch(() => null)
      if (!resp.ok) {
        setErrorMsg(data?.errors?.join(' · ') || data?.message || (resp.status === 429 ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' : 'Não foi possível enviar. Tente novamente.'))
        return
      }
      setResultado({ codigo: data.codigo, email: data.email, nomes: data.participantes.map((p: { nome: string }) => p.nome) })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setErrorMsg('Não foi possível confirmar o envio. Confira sua conexão antes de tentar novamente.')
    } finally {
      enviando.current = false
      setSubmitting(false)
    }
  }

  if (resultado) {
    return (
      <section className="inscricao-pagina inscricao-sucesso" aria-live="polite">
        <Check size={40} aria-hidden="true" />
        <h1>Presença registrada!</h1>
        <p>Esperamos vocês no Holywins!</p>
        <p><strong>{resultado.nomes.length} pessoa(s):</strong> {resultado.nomes.join(', ')}</p>
        {resultado.email && <p>A confirmação também será enviada para <strong>{resultado.email}</strong>.</p>}
        <p>Código da inscrição: <strong>{resultado.codigo}</strong></p>
        <Link to="/" className="primary-btn">Voltar ao início</Link>
      </section>
    )
  }

  return (
    <section className="inscricao-pagina">
      {!embedded && <Link to="/" className="inscricao-voltar"><ArrowLeft size={18} aria-hidden="true" /> Voltar</Link>}
      {embedded ? <h2>Inscreva-se no Holywins Corumbá</h2> : <h1>Holywins Corumbá</h1>}
      <p>Sua presença nos ajuda a preparar tudo com carinho. Todos são bem-vindos!</p>
      {!carregando && !inscricoesAbertas && <p className="inscricao-aviso" role="status">As inscrições abrem em breve.</p>}
      <form onSubmit={handleSubmit} onInvalidCapture={(event) => {
        const details = (event.target as HTMLElement).closest('details')
        if (details) details.open = true
      }}>
        <fieldset disabled={submitting} className="inscricao-campos">
          <legend>Inscrição</legend>
          <label>Seu nome *
            <input autoComplete="name" maxLength={255} value={nome} onChange={(e) => setNome(e.target.value)} required />
          </label>
          <label>Telefone / WhatsApp *
            <input type="tel" autoComplete="tel" maxLength={40} value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
          </label>
          <label>E-mail (opcional)
            <input type="email" autoComplete="email" maxLength={255} aria-describedby="inscricao-email-ajuda" value={email} onChange={(e) => setEmail(e.target.value)} />
            <small id="inscricao-email-ajuda">Informe seu e-mail para receber o comprovante de inscrição.</small>
          </label>
          <label>Paróquia / comunidade (opcional)
            <input maxLength={255} value={paroquia} onChange={(e) => setParoquia(e.target.value)} />
          </label>
          <label className="inscricao-checkbox">
            <input type="checkbox" checked={vouParticipar} onChange={(e) => setVouParticipar(e.target.checked)} />
            Eu vou estar no evento, inclusive se for apenas acompanhar uma criança
          </label>
          <small>Todos que estarão no evento precisam estar inscritos e entram na contagem para alimentação e organização. Informar apenas seu nome e telefone como contato não inscreve você como participante.</small>
          <p className="inscricao-aviso">{avisoAcompanhante}</p>
          {vouParticipar && detalhesPessoa(eu, (patch) => setEu((p) => ({ ...p, ...patch })))}
          {acompanhantes.map((pessoa, index) => (
            <fieldset key={pessoa.id} className="inscricao-pessoa">
              <legend>Pessoa {index + 1 + (vouParticipar ? 1 : 0)}</legend>
              <button type="button" className="inscricao-remover" title="Remover pessoa" aria-label={'Remover pessoa ' + (index + 1 + (vouParticipar ? 1 : 0))} onClick={() => setAcompanhantes((pessoas) => pessoas.filter((p) => p.id !== pessoa.id))}>
                <Trash2 size={20} aria-hidden="true" />
              </button>
              <label>Nome *
                <input maxLength={255} value={pessoa.nome} onChange={(e) => setAcompanhantes((pessoas) => pessoas.map((p) => p.id === pessoa.id ? { ...p, nome: e.target.value } : p))} required />
              </label>
              {detalhesPessoa(pessoa, (patch) => setAcompanhantes((pessoas) => pessoas.map((p) => p.id === pessoa.id ? { ...p, ...patch } : p)))}
            </fieldset>
          ))}
          <button type="button" className="ghost-btn inscricao-adicionar" onClick={adicionarPessoa}><Plus size={20} aria-hidden="true" /> Adicionar pessoa</button>
          {temCrianca && !temAdulto && <p className="inscricao-aviso" role="status">Falta incluir um acompanhante adulto entre os participantes.</p>}
          <p className="inscricao-total" aria-live="polite"><strong>{total}</strong> pessoa(s) para o evento</p>
          {errorMsg && <p className="inscricao-erro" role="alert">{errorMsg}</p>}
          <button type="submit" className="primary-btn" disabled={submitting || carregando || !inscricoesAbertas}>{carregando ? 'Carregando...' : submitting ? 'Enviando...' : 'Confirmar presença'}</button>
        </fieldset>
      </form>
    </section>
  )
}
