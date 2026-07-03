export const INTEGRATION_META: Record<string, {
  name: string
  description: string
  category: string
  color: string
  fields: { key: string; label: string; type?: string; placeholder?: string }[]
  docsUrl?: string
}> = {
  claude: {
    name: "Claude AI",
    description: "Assistente de IA para sugestões de produtos, atendimento e análises.",
    category: "IA",
    color: "#c96442",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "sk-ant-..." },
      { key: "model", label: "Modelo", placeholder: "claude-sonnet-4-6" },
    ],
    docsUrl: "https://console.anthropic.com",
  },
  whatsapp: {
    name: "WhatsApp Business",
    description: "Envio de orçamentos, confirmações de pedido e notificações para clientes.",
    category: "Comunicação",
    color: "#25d366",
    fields: [
      { key: "token", label: "Token de acesso", type: "password", placeholder: "EAAxxxxx..." },
      { key: "phoneNumberId", label: "Phone Number ID", placeholder: "1234567890" },
      { key: "businessAccountId", label: "Business Account ID", placeholder: "1234567890" },
    ],
    docsUrl: "https://developers.facebook.com/docs/whatsapp",
  },
  instagram: {
    name: "Instagram",
    description: "Catálogo de produtos, DMs automáticos e sincronização de pedidos do Instagram Shopping.",
    category: "Social",
    color: "#e1306c",
    fields: [
      { key: "accessToken", label: "Access Token", type: "password", placeholder: "IGQxxxxx..." },
      { key: "businessId", label: "Business Account ID", placeholder: "1234567890" },
      { key: "catalogId", label: "Catalog ID", placeholder: "1234567890" },
    ],
    docsUrl: "https://developers.facebook.com/docs/instagram-api",
  },
  facebook: {
    name: "Facebook / Meta",
    description: "Catálogo de produtos, anúncios dinâmicos e Facebook Shop integrado ao estoque.",
    category: "Social",
    color: "#1877f2",
    fields: [
      { key: "accessToken", label: "Access Token", type: "password", placeholder: "EAAxxxxx..." },
      { key: "pageId", label: "Page ID", placeholder: "1234567890" },
      { key: "catalogId", label: "Catalog ID", placeholder: "1234567890" },
    ],
    docsUrl: "https://developers.facebook.com",
  },
  mercadolivre: {
    name: "Mercado Livre",
    description: "Sincronização de estoque e recebimento de pedidos do Mercado Livre.",
    category: "Marketplace",
    color: "#ffe600",
    fields: [
      { key: "clientId", label: "App ID", placeholder: "1234567890" },
      { key: "clientSecret", label: "Client Secret", type: "password", placeholder: "xxxxxxxxxx" },
      { key: "sellerId", label: "Seller ID", placeholder: "MLB123456789" },
    ],
    docsUrl: "https://developers.mercadolivre.com.br",
  },
  googlesheets: {
    name: "Google Sheets",
    description: "Exporte relatórios de vendas e estoque diretamente para planilhas Google.",
    category: "Produtividade",
    color: "#34a853",
    fields: [
      { key: "serviceAccountJson", label: "Service Account JSON", type: "textarea", placeholder: '{"type":"service_account",...}' },
      { key: "spreadsheetId", label: "ID da planilha", placeholder: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" },
    ],
    docsUrl: "https://console.cloud.google.com",
  },
  tiktok: {
    name: "TikTok Shop",
    description: "Sincronização de estoque, pedidos e produtos com o TikTok Shop.",
    category: "Marketplace",
    color: "#010101",
    fields: [
      { key: "appKey", label: "App Key", placeholder: "xxxxxxxxxx" },
      { key: "appSecret", label: "App Secret", type: "password", placeholder: "xxxxxxxxxx" },
      { key: "shopId", label: "Shop ID", placeholder: "xxxxxxxxxx" },
      { key: "accessToken", label: "Access Token", type: "password", placeholder: "xxxxxxxxxx" },
    ],
    docsUrl: "https://partner.tiktokshop.com",
  },
  shopee: {
    name: "Shopee",
    description: "Sincronização de produtos e pedidos da Shopee.",
    category: "Marketplace",
    color: "#ee4d2d",
    fields: [
      { key: "partnerId", label: "Partner ID", placeholder: "1234567" },
      { key: "partnerKey", label: "Partner Key", type: "password", placeholder: "xxxxxxxxxx" },
      { key: "shopId", label: "Shop ID", placeholder: "1234567" },
    ],
    docsUrl: "https://open.shopee.com",
  },
}
