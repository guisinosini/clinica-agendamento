"use client";

import Link from "next/link";

export default function PoliticaPrivacidade() {
  return (
    <div className="container" style={{ padding: '3rem 1rem', maxWidth: '800px', margin: '0 auto', backgroundColor: 'var(--bg-color)', minHeight: '100vh', color: 'var(--text-main)' }}>
      <div className="card animate-slide" style={{ padding: '2.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>←</span> Voltar para o Início
          </Link>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '1rem' }}>Política de Privacidade</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>1. Objetivo</h2>
          <p style={{ lineHeight: '1.6' }}>
            A presente Política de Privacidade tem por objetivo demonstrar o compromisso da nossa Clínica com a segurança, a privacidade e a transparência no tratamento das informações e dados pessoais de nossos pacientes, em estrita conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)</strong>.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>2. Dados Coletados e Finalidade</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
            A clínica coleta dados estritamente necessários para a execução dos serviços de saúde. Os dados pessoais (nome, CPF, contato, data de nascimento) e dados sensíveis (histórico clínico, plano de saúde) são coletados exclusivamente com as seguintes finalidades:
          </p>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li>Prestação adequada dos serviços de saúde e acompanhamento clínico;</li>
            <li>Agendamento, confirmação e gestão de consultas;</li>
            <li>Emissão de relatórios médicos, atestados e prescrições;</li>
            <li>Comunicação com o paciente para envio de lembretes e avisos importantes.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>3. Armazenamento e Retenção</h2>
          <p style={{ lineHeight: '1.6' }}>
            Os dados pessoais serão armazenados em ambiente seguro e controlado. Os prontuários médicos e registros clínicos são mantidos pelo prazo mínimo exigido por lei e regulamentações dos conselhos de classe (geralmente 20 anos a partir do último registro), visando garantir o cumprimento de obrigação legal ou regulatória pelo controlador.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>4. Compartilhamento de Dados</h2>
          <p style={{ lineHeight: '1.6' }}>
            A clínica não comercializa seus dados pessoais. O compartilhamento ocorre apenas quando necessário para a execução do contrato (ex: validação com operadoras de plano de saúde), para cumprimento de obrigação legal ou mediante ordem judicial.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>5. Direitos do Titular (Paciente)</h2>
          <p style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
            Conforme a LGPD, o paciente tem direito a:
          </p>
          <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
            <li>Confirmar a existência de tratamento de seus dados;</li>
            <li>Acessar e solicitar cópia de seus dados;</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
            <li>Revogar o consentimento, salvo nas hipóteses de guarda obrigatória (prontuário clínico).</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>6. Contato (DPO / Encarregado)</h2>
          <p style={{ lineHeight: '1.6' }}>
            Para exercer seus direitos ou tirar dúvidas sobre esta política e o tratamento de seus dados, entre em contato conosco diretamente na recepção da clínica ou solicite falar com o Encarregado de Proteção de Dados (DPO).
          </p>
        </section>

      </div>
    </div>
  );
}
