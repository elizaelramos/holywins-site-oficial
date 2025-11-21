export default function SantoDoDia() {
  return (
    <div className="page-stack">
      <section className="page-card reveal-on-scroll">
        <p className="eyebrow">Santo do dia</p>
        <h1>Conecte-se com o Santo do dia</h1>
        <p>
          Acompanhe diariamente os testemunhos e reflexões da Comunidade Canção Nova dentro do nosso
          portal. A página abaixo abre a versão oficial da Canção Nova, mas você permanece dentro da nossa
          navegação para manter o fluxo espiritual no mesmo lugar.
        </p>
      </section>

      <section
        className="page-card reveal-on-scroll"
        style={{ padding: 0, minHeight: 'calc(100vh - 120px)' }}
      >
        <iframe
          title="Santo do Dia - Canção Nova"
          src="https://santo.cancaonova.com/"
          loading="lazy"
          className="santo-iframe"
          style={{
            width: '100%',
            minHeight: 'calc(100vh - 160px)',
            height: 'calc(100vh - 160px)',
            border: 'none',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        />
      </section>
    </div>
  )
}
