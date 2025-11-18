# Tabelas e inserções de dados que utilizei no meu Banco de Dados


###  1. Criação das Tabelas
````

CREATE TABLE usuarios (
  id_usuario SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL
);

CREATE TABLE produtos (
  id_produto SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  estoque_minimo INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE movimentacoes (
  id_movimentacao SERIAL PRIMARY KEY,
  produto_id INTEGER NOT NULL REFERENCES produtos(id_produto),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id_usuario),
  tipo TEXT NOT NULL,
  quantidade INTEGER NOT NULL,
  data_movimentacao TIMESTAMP NOT NULL DEFAULT NOW(),
  observacao TEXT
);

````
<br/>
<br/>

### 2. Inserção de Dados 
````
INSERT INTO usuarios (nome, email, senha) VALUES
  ('Guilherme Zamboni', 'gui@gmail.com', '123'),
  ('Eduardo Santos', 'edu@gmail.com', '456'),
  ('Daniel Garcia', 'dan@gmail.com', '789')
ON CONFLICT (email) DO NOTHING;

INSERT INTO produtos (nome, quantidade, estoque_minimo) VALUES
  ('Martelo de Unha', 50, 10),
  ('Alicate', 60, 10),
  ('Chave inglesa', 30, 10),
  ('Cerrote', 40, 10),
  ('Chave de Fenda', 20, 10)
ON CONFLICT DO NOTHING;

````
<br/>
<br/>

### 3. Inserção de Movimentações 
````

INSERT INTO movimentacoes (produto_id, usuario_id, tipo, quantidade, data_movimentacao, observacao) VALUES
  ((SELECT id_produto FROM produtos WHERE nome='Alicate'),
   (SELECT id_usuario FROM usuarios WHERE email='gui@gmail.com'),
   'entrada', 33, NOW() - INTERVAL '2 days', 'Compra inicial'),
   
  ((SELECT id_produto FROM produtos WHERE nome='Chave inglesa'),
   (SELECT id_usuario FROM usuarios WHERE email='gui@gmail.com'),
   'entrada', 57, NOW() - INTERVAL '3 days', 'Compra inicial'),
   
  ((SELECT id_produto FROM produtos WHERE nome='Cerrote'),
   (SELECT id_usuario FROM usuarios WHERE email='gui@gmail.com'),
   'entrada', 21, NOW() - INTERVAL '4 days', 'Compra inicial');



INSERT INTO movimentacoes (produto_id, usuario_id, tipo, quantidade, data_movimentacao, observacao) VALUES
  ((SELECT id_produto FROM produtos WHERE nome='Martelo de Unha'),
   (SELECT id_usuario FROM usuarios WHERE email='edu@gmail.com'),
   'saida', 7, NOW() - INTERVAL '3 day', 'Retirado para analize'),
   
  ((SELECT id_produto FROM produtos WHERE nome='Chave de Fenda'),
   (SELECT id_usuario FROM usuarios WHERE email='edu@gmail.com'),
   'saida', 2, NOW() - INTERVAL '2 day', 'Retirada por estar com defeito'),
   
  ((SELECT id_produto FROM produtos WHERE nome='Cerrote'),
   (SELECT id_usuario FROM usuarios WHERE email='edu@gmail.com'),
   'saida', 21, NOW() - INTERVAL '1 day', 'Retirado pelo fio estar cego ');



INSERT INTO movimentacoes (produto_id, usuario_id, tipo, quantidade, observacao) VALUES
  ((SELECT id_produto FROM produtos WHERE nome='Chave inglesa'),
   (SELECT id_usuario FROM usuarios WHERE email='gui@gmail.com'),
   'entrada', 10, 'Devouvendo para o estoque'),
   
  ((SELECT id_produto FROM produtos WHERE nome='Alicate'),
   (SELECT id_usuario FROM usuarios WHERE email='edu@gmail.com'),
   'entrada', 3, 'Devouvendo para o estoque'),
   
  ((SELECT id_produto FROM produtos WHERE nome='Cerrote'),
   (SELECT id_usuario FROM usuarios WHERE email='dan@gmail.com'),
   'entrada', 14, 'Devouvendo para o estoque');

   ````

   <br/>