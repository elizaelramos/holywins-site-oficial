-- Seed para tabela communities com dados reais de Corumbá-MS

INSERT INTO communities (
  name,
  is_headquarters,
  headquarters_id,
  priest_name,
  priest_photo_url,
  mass_schedule,
  address,
  phone,
  instagram_url,
  facebook_url,
  image_url
) VALUES
(
  'Paróquia São João Bosco',
  1,
  NULL,
  'Pe. João Silva',
  '/images/priest-default.jpg',
  'Seg a Sex: 07:30 e 19:00 | Sáb: 19:00 | Dom: 07:00, 09:00 e 19:00',
  'R. Dom Aquino Correa, 2758 - Dom Bosco, Corumbá - MS',
  '(67) 3231-4301',
  'https://instagram.com/paroquiasaojoaoboscocorumba',
  'https://facebook.com/paroquiasaojoaoboscocorumba',
  '/images/igreja-sao-joao-bosco.jpg'
),
(
  'Igreja Nossa Senhora Aparecida',
  0,
  NULL,
  'Pe. João Silva',
  '/images/priest-default.jpg',
  'Dom: 08:00 e 18:00',
  'R. Ten. Melquíades de Jesus, 1551 - Centro, Corumbá - MS',
  '(67) 3231-4301',
  'https://instagram.com/paroquiasaojoaoboscocorumba',
  'https://facebook.com/paroquiasaojoaoboscocorumba',
  '/images/igreja-nossa-senhora-aparecida.jpg'
),
(
  'Comunidade Santo Antônio',
  0,
  NULL,
  'Pe. João Silva',
  '/images/priest-default.jpg',
  'Dom: 19:00',
  'R. Afonso Pena - Universitário, Corumbá - MS',
  '(67) 3231-4301',
  'https://instagram.com/paroquiasaojoaoboscocorumba',
  'https://facebook.com/paroquiasaojoaoboscocorumba',
  '/images/igreja-santo-antonio.jpg'
),
(
  'Santuário de Nossa Senhora Auxiliadora',
  0,
  NULL,
  'Pe. Salesiano Responsável',
  '/images/priest-default.jpg',
  'Seg a Sex: 07:00 e 18:00 | Sáb: 18:00 | Dom: 07:00, 09:00 e 18:00',
  'R. Dom Aquino Correa, 1037 - Centro, Corumbá - MS',
  '(67) 3231-3113',
  'https://instagram.com/santuarionsauxiliadora',
  'https://facebook.com/santuarionsauxiliadora',
  '/images/santuario-auxiliadora.jpg'
);
