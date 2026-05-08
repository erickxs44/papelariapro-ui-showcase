-- Criar a função que será chamada pelo Trigger
CREATE OR REPLACE FUNCTION estorno_estoque_venda()
RETURNS trigger AS $$
BEGIN
  -- Atualiza o estoque do produto somando a quantidade que foi excluída (estornada)
  UPDATE produtos
  SET estoque_atual = estoque_atual + OLD.quantidade
  WHERE id = OLD.produto_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Criar o Trigger na tabela itens_venda
-- O trigger é acionado APÓS a exclusão de um registro na tabela itens_venda
DROP TRIGGER IF EXISTS tr_estorno_estoque_venda ON itens_venda;
CREATE TRIGGER tr_estorno_estoque_venda
AFTER DELETE ON itens_venda
FOR EACH ROW
EXECUTE FUNCTION estorno_estoque_venda();
