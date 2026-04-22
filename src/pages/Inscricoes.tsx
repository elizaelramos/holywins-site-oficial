import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Check } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

type Participante = {
  nome: string
  idade: string
  paroquia: string
  movimento: string
  restricaoAlimentar: string
  santoDevocao: string
  participaDesfile: 'sim' | 'nao' | ''
  autorizaImagem: boolean
  eResponsavel: boolean
}

type Responsavel = {
  nome: string
  email: string
  telefone: string
  paroquia: string
  comoSoube: string
  conhecePagina: boolean
  naoVouParticipar: boolean
}

const emptyResponsavel: Responsavel = {
  nome: '',
  email: '',
  telefone: '',
  paroquia: '',
  comoSoube: '',
  conhecePagina: false,
  naoVouParticipar: false,
}

function novoParticipante(resp?: Responsavel): Participante {
  return {
    nome: '',
    idade: '',
    paroquia: resp?.paroquia ?? '',
    movimento: '',
    restricaoAlimentar: '',
    santoDevocao: '',
    participaDesfile: '',
    autorizaImagem: true,
    eResponsavel: false,
  }
}

const comoSoubeOpcoes = [
  'Facebook',
  'Instagram',
  'WhatsApp',
  'Amigos / família',
  'Paróquia / comunidade',
  'Site holywinscorumba.com',
  'Outro',
]

export default function Inscricoes() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [responsavel, setResponsavel] = useState<Responsavel>(emptyResponsavel)
  const [participantes, setParticipantes] = useState<Participante[]>([novoParticipante()])
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [resultado, setResultado] = useState<{ codigo: string; email: string; nomes: string[] } | null>(null)

  const inscricoesAbertas = import.meta.env.VITE_INSCRICOES_ABERTAS === 'true'

  function updateResp<K extends keyof Responsavel>(key: K, value: Responsavel[K]) {
    setResponsavel((prev) => ({ ...prev, [key]: value }))
  }

  function updatePart(index: number, patch: Partial<Participante>) {
    setParticipantes((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  function addParticipante() {
    setParticipantes((prev) => [...prev, novoParticipante(responsavel)])
  }

  function removeParticipante(index: number) {
    setParticipantes((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  function goToStep2(e: FormEvent) {
    e.preventDefault()
    setErrorMsg('')
    setParticipantes((prev) => {
      const copy = [...prev]
      if (!responsavel.naoVouParticipar) {
        copy[0] = {
          ...copy[0],
          nome: copy[0].nome || responsavel.nome,
          eResponsavel: true,
          paroquia: copy[0].paroquia || responsavel.paroquia,
        }
      } else if (copy[0]?.eResponsavel) {
        copy[0] = { ...copy[0], eResponsavel: false }
      }
      return copy
    })
    setStep(2)
  }

  function goToStep3() {
    setErrorMsg('')
    for (let i = 0; i < participantes.length; i++) {
      if (!participantes[i].nome.trim()) {
        setErrorMsg(`Preencha o nome do participante #${i + 1}.`)
        return
      }
      if (!participantes[i].participaDesfile) {
        setErrorMsg(`Informe se o participante #${i + 1} vai participar do desfile.`)
        return
      }
    }
    setStep(3)
  }

  async function handleSubmit() {
    if (!inscricoesAbertas) {
      setErrorMsg('As inscrições ainda não estão abertas.')
      return
    }
    setSubmitting(true)
    setErrorMsg('')
    try {
      const resp = await fetch(`${API_URL}/inscricoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: responsavel.nome,
          email: responsavel.email,
          telefone: responsavel.telefone,
          paroquia: responsavel.paroquia,
          comoSoube: responsavel.comoSoube,
          conhecePagina: responsavel.conhecePagina,
          participantes: participantes.map((p) => ({
            ...p,
            idade: p.idade === '' ? null : Number(p.idade),
            participaDesfile: p.participaDesfile === 'sim',
          })),
        }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        if (resp.status === 409 && data.codigo) {
          setErrorMsg(`Este e-mail já tem uma inscrição (código ${data.codigo}).`)
        } else if (data.errors) {
          setErrorMsg(data.errors.join(' · '))
        } else {
          setErrorMsg(data.message ?? 'Erro ao enviar inscrição')
        }
        return
      }
      setResultado({
        codigo: data.codigo,
        email: data.email,
        nomes: (data.participantes ?? []).map((p: { nome: string }) => p.nome),
      })
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Erro inesperado')
    } finally {
      setSubmitting(false)
    }
  }

  if (resultado) {
    return (
      <section className="page-card" style={{ maxWidth: 640, margin: '2rem auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', width: 64, height: 64, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <Check size={32} color="#22c55e" />
          </div>
          <p className="eyebrow">Inscrição confirmada</p>
          <h1>Pronto!</h1>
          <p>Enviamos a confirmação para <strong>{resultado.email}</strong>.</p>
          <div style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.35)', borderRadius: 12, padding: '1.5rem', margin: '1.5rem 0' }}>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '0.875rem' }}>Seu código de inscrição</p>
            <p style={{ fontFamily: 'monospace', fontSize: '1.75rem', fontWeight: 700, margin: '0.25rem 0' }}>{resultado.codigo}</p>
          </div>
          <p style={{ opacity: 0.8 }}>
            <strong>{resultado.nomes.length}</strong> participante(s): {resultado.nomes.join(', ')}
          </p>
          <p style={{ opacity: 0.7, fontSize: '0.875rem', marginTop: '1.5rem' }}>
            Guarde o código. Ele é a referência da sua inscrição em caso de dúvida.
          </p>
          <Link to="/" className="primary-btn" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Voltar ao início
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="page-card" style={{ maxWidth: 720, margin: '2rem auto' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.875rem' }}>
        <ArrowLeft size={16} /> Voltar
      </Link>

      <p className="eyebrow">Holywins Corumbá</p>
      <h1>Inscrição</h1>

      {!inscricoesAbertas && (
        <div style={{ background: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.4)', borderRadius: 10, padding: '1rem', margin: '1rem 0' }}>
          <strong>Prévia para a organização:</strong> as inscrições abrem em setembro. Este formulário está em modo de demonstração — o botão final de envio está desativado.
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', margin: '1.5rem 0' }}>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: step >= n ? 'var(--accent, #8b5cf6)' : 'rgba(255,255,255,0.1)',
              transition: 'background 200ms',
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '1.5rem' }}>
        Etapa {step} de 3 — {step === 1 ? 'Responsável' : step === 2 ? 'Participantes' : 'Revisão'}
      </p>

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 10, padding: '0.75rem 1rem', margin: '1rem 0', color: '#fca5a5' }}>
          {errorMsg}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={goToStep2} className="gallery-form">
          <p style={{ opacity: 0.85, marginBottom: '1rem' }}>
            Preencha os dados do <strong>responsável pela inscrição</strong>. Você só precisa fazer isso uma vez, mesmo inscrevendo várias pessoas.
          </p>

          <label>
            Nome completo*
            <input value={responsavel.nome} onChange={(e) => updateResp('nome', e.target.value)} required />
          </label>
          <label>
            E-mail*
            <input type="email" value={responsavel.email} onChange={(e) => updateResp('email', e.target.value)} required />
          </label>
          <label>
            Telefone* (WhatsApp, se possível)
            <input value={responsavel.telefone} onChange={(e) => updateResp('telefone', e.target.value)} placeholder="(67) 9 9999-9999" required />
          </label>
          <label>
            Paróquia / Comunidade
            <input value={responsavel.paroquia} onChange={(e) => updateResp('paroquia', e.target.value)} />
          </label>
          <label>
            Como ficou sabendo do evento?
            <select value={responsavel.comoSoube} onChange={(e) => updateResp('comoSoube', e.target.value)}>
              <option value="">Selecione...</option>
              {comoSoubeOpcoes.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input type="checkbox" checked={responsavel.naoVouParticipar} onChange={(e) => updateResp('naoVouParticipar', e.target.checked)} />
            Eu NÃO vou participar (vou apenas inscrever outros participantes)
          </label>
          <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem' }}>
            Por padrão, você será incluído automaticamente como participante. Marque a caixa acima se estiver inscrevendo somente outras pessoas.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="primary-btn">Próximo</button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div>
          <p style={{ opacity: 0.85, marginBottom: '1rem' }}>
            Adicione um cartão para cada pessoa inscrita. Paróquia/comunidade já vem preenchida do responsável — ajuste se for diferente.
          </p>

          {participantes.map((p, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <strong>Participante #{i + 1}{p.eResponsavel ? ' (você)' : ''}</strong>
                {participantes.length > 1 && (
                  <button type="button" onClick={() => removeParticipante(i)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Trash2 size={16} /> Remover
                  </button>
                )}
              </div>

              <div className="gallery-form" style={{ gap: '0.75rem' }}>
                <label>
                  Nome completo*
                  <input value={p.nome} onChange={(e) => updatePart(i, { nome: e.target.value })} required />
                </label>
                <label>
                  Idade
                  <input type="number" min={0} max={120} value={p.idade} onChange={(e) => updatePart(i, { idade: e.target.value })} />
                </label>
                <label>
                  Paróquia / Comunidade
                  <input value={p.paroquia} onChange={(e) => updatePart(i, { paroquia: e.target.value })} />
                </label>
                <label>
                  Participa de algum movimento da igreja? Qual?
                  <input value={p.movimento} onChange={(e) => updatePart(i, { movimento: e.target.value })} placeholder="Ex.: Jovens, RCC, etc." />
                </label>
                <label>
                  Restrição alimentar?
                  <input value={p.restricaoAlimentar} onChange={(e) => updatePart(i, { restricaoAlimentar: e.target.value })} placeholder="Ex.: glúten, lactose, nenhuma" />
                </label>
                <label>
                  Santo(a) de devoção
                  <input value={p.santoDevocao} onChange={(e) => updatePart(i, { santoDevocao: e.target.value })} />
                </label>
                <label>
                  Pretende participar do concurso de caracterização (desfile)?*
                  <select
                    value={p.participaDesfile}
                    onChange={(e) => updatePart(i, { participaDesfile: e.target.value as 'sim' | 'nao' | '' })}
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </label>
              </div>
            </div>
          ))}

          <button type="button" onClick={addParticipante} className="ghost-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Plus size={16} /> Adicionar participante
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <button type="button" className="ghost-btn" onClick={() => setStep(1)}>Voltar</button>
            <button type="button" className="primary-btn" onClick={goToStep3}>Próximo</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Revisão</h2>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' }}>
            <p className="eyebrow">Responsável</p>
            <p><strong>{responsavel.nome}</strong></p>
            <p style={{ opacity: 0.85, fontSize: '0.875rem' }}>{responsavel.email} · {responsavel.telefone}</p>
            {responsavel.paroquia && <p style={{ opacity: 0.85, fontSize: '0.875rem' }}>{responsavel.paroquia}</p>}
          </div>

          <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Participantes ({participantes.length})</p>
          {participantes.map((p, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.5rem' }}>
              <strong>{p.nome}</strong>
              {p.idade && <> · {p.idade} anos</>}
              {p.participaDesfile === 'sim' && <> · desfile</>}
              {p.restricaoAlimentar && <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Restrição: {p.restricaoAlimentar}</div>}
            </div>
          ))}

          <details style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '1rem', margin: '1.5rem 0', fontSize: '0.875rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Termo de autorização de uso de imagem (LGPD)</summary>
            <div style={{ marginTop: '0.75rem', lineHeight: 1.6, opacity: 0.9 }}>
              <p>Ao efetivar sua inscrição, você autoriza, de forma gratuita, definitiva e irrevogável, a utilização de sua imagem, voz e nome captados durante o evento para fins de divulgação institucional, promocional e jornalística.</p>
              <p>A utilização inclui publicação em redes sociais oficiais, materiais de marketing, site oficial e mídias produzidas durante o evento, sem fins lucrativos e respeitando a integridade dos participantes.</p>
              <p>Todos os dados seguirão a Lei n° 13.709/2018 (LGPD).</p>
            </div>
          </details>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="ghost-btn" onClick={() => setStep(2)} disabled={submitting}>Voltar</button>
            <button
              type="button"
              className="primary-btn"
              onClick={handleSubmit}
              disabled={submitting || !inscricoesAbertas}
              title={!inscricoesAbertas ? 'Inscrições abrem em setembro' : ''}
            >
              {submitting ? 'Enviando...' : inscricoesAbertas ? 'Confirmar inscrição' : 'Inscrições abrem em setembro'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
