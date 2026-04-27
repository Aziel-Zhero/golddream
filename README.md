# 🐻 Gold Dream Multimarcas - E-commerce Premium

Bem-vindo ao repositório da **Gold Dream Multimarcas**, uma plataforma de e-commerce de alta performance desenvolvida para oferecer uma experiência de compra exclusiva e sofisticada. O sistema combina a agilidade do digital com o atendimento personalizado via WhatsApp.

---

## 🚀 Tecnologias Utilizadas

Este projeto foi construído com as tecnologias mais modernas do mercado para garantir escalabilidade, segurança e SEO:

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS & [ShadCN UI](https://ui.shadcn.com/)
- **Backend:** [Firebase](https://firebase.google.com/) (Firestore, Auth, App Hosting)
- **Inteligência Artificial:** [Genkit](https://firebase.google.com/docs/genkit) (Gemini 2.5 Flash)
- **Ícones:** Lucide React
- **Notificações:** Telegram Bot API Integration

---

## ✨ Funcionalidades Principais

### 🛍️ E-commerce (Front-end)
- **Navegação Inteligente:** Categorias dinâmicas (Feminino, Masculino, Acessórios).
- **Sacola de Compras:** Gestão em tempo real com validação de estoque.
- **Personal Stylist (AI):** Recomendador de looks baseado em inteligência artificial que analisa preferências do usuário.
- **Checkout Transparente:** Fluxo otimizado para reserva de pedidos e finalização manual via WhatsApp.
- **Design Responsivo:** Adaptado perfeitamente para dispositivos móveis e desktop.
- **Black Friday Mode:** Sistema que altera automaticamente o tema do site para Dark Mode durante campanhas promocionais de Black Friday.

### 🔐 Autenticação e Perfil
- **Firebase Auth:** Login/Cadastro seguro.
- **Verificação de E-mail:** Fluxo integrado para garantir contas legítimas.
- **Gestão de Perfil:** Dados de entrega salvos para compras futuras rápidas.
- **Histórico de Pedidos:** Acompanhamento de status em tempo real.

### 👑 Painel Administrativo (Controle Total)
- **Dashboard Executivo:** Métricas de faturamento mensal, pedidos entregues, pendentes e cancelados.
- **Gestão de Pedidos:** Alteração de status e exclusão definitiva de registros.
- **Gestão de Produtos:** Cadastro, edição de imagens (com compressão automática), variantes de cores e tamanhos.
- **Customização do Site:** Edição dinâmica da Hero Section, Benefícios e Guia de Compra sem mexer no código.
- **Configurações de Venda:** Regras de frete por localidade, cupons de desconto e campanhas promocionais.
- **Notificações:** Configuração de bot do Telegram para receber alertas de vendas instantaneamente.

---

## 🛠️ Configuração e Instalação

Para rodar o projeto localmente:

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz com as chaves do Firebase e sua API Key do Google AI (Gemini).

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Abra o navegador:**
   Acesse `http://localhost:9002`

---

## 📁 Estrutura de Pastas Principal

- `/src/app`: Rotas e páginas da aplicação (Next.js App Router).
- `/src/components`: Componentes reutilizáveis (UI e Layout).
- `/src/context`: Contextos do React (Autenticação e Carrinho).
- `/src/firebase`: Configurações e hooks de conexão com o Firebase.
- `/src/ai`: Fluxos do Genkit para o recomendador inteligente.
- `/docs/backend.json`: Blueprint da estrutura de dados do Firestore.

---

## 📄 Licença

Este projeto é de uso exclusivo da **Gold Dream Multimarcas**. Todos os direitos reservados.

---

*Desenvolvido com carinho para elevar o padrão da moda premium.* 🐻✨
