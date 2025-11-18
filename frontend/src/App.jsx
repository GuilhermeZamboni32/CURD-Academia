
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const API = axios.create({
  baseURL: "http://localhost:3000",
  timeout: 8000,
});

// util
const notEmpty = (v) => String(v ?? "").trim().length > 0;
const toInt = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

export default function App() {
 
  const [view, setView] = useState("login"); 
  const [user, setUser] = useState(null); 

  
  ///////////////    login    ///////////////
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const doLogin = async (e) => {
    e?.preventDefault();
    if (!notEmpty(loginEmail) || !notEmpty(loginSenha)) {
      alert("Informe email e senha.");
      return;
    }
    try {
      const { data } = await API.post("/auth/login", {
        email: loginEmail,
        senha: loginSenha,
      });
      setUser(data);
      setView("home");
      setLoginEmail("");
      setLoginSenha("");
    } catch (err) {
      alert(err?.response?.data?.error || "Falha no login");
    }
  };

  const logout = () => {
    setUser(null);
    setView("login");
  };

  ///////////////    produto e estoque    ///////////////
  const [produtos, setProdutos] = useState([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [q, setQ] = useState(""); 

  
  const emptyProduto = { id: null, nome: "", quantidade: 0, estoque_minimo: 0 };
  const [produtoForm, setProdutoForm] = useState(emptyProduto);
  const [editandoId, setEditandoId] = useState(null);

  const carregarProdutos = async (term = q) => {
    setLoadingProdutos(true);
    try {
      const url = notEmpty(term) ? `/produtos?q=${encodeURIComponent(term)}` : "/produtos";
      const { data } = await API.get(url);
      setProdutos(Array.isArray(data) ? data : []);
    } catch (e) {
      alert("Erro ao carregar produtos");
    } finally {
      setLoadingProdutos(false);
    }
  };

  useEffect(() => {
    if (view === "produtos" || view === "estoque") carregarProdutos();
  }, [view]);

  const produtosOrdenados = useMemo(() => {
    return [...produtos].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
  }, [produtos]);

  const limparProdutoForm = () => {
    setProdutoForm(emptyProduto);
    setEditandoId(null);
  };

  const validarProdutoForm = () => {
    const { nome, quantidade, estoque_minimo } = produtoForm;
    if (!notEmpty(nome)) return "Informe o nome do produto.";
    if (toInt(quantidade) < 0) return "A quantidade de produtos não pode ser negativa.";
    if (toInt(estoque_minimo) < 0) return "O estoque mínimo não pode ser negativo.";
    return null;
  };

  const criarProduto = async () => {
    const msg = validarProdutoForm();
    if (msg) return alert(msg);
    try {
      await API.post("/produtos", {
        nome: produtoForm.nome.trim(),
        quantidade: toInt(produtoForm.quantidade),
        estoque_minimo: toInt(produtoForm.estoque_minimo),
      });
      await carregarProdutos();
      limparProdutoForm();
    } catch (e) {
      alert(e?.response?.data?.error || "Erro ao criar produto");
    }
  };

  const iniciarEdicao = (p) => {
    setEditandoId(p.id);
    setProdutoForm({
      id: p.id,
      nome: p.nome,
      quantidade: p.quantidade,
      estoque_minimo: p.estoque_minimo,
    });
  };

  const salvarProduto = async () => {
    if (!editandoId) return;
    const msg = validarProdutoForm();
    if (msg) return alert(msg);
    try {
      await API.put(`/produtos/${editandoId}`, {
        nome: produtoForm.nome.trim(),
        quantidade: toInt(produtoForm.quantidade),
        estoque_minimo: toInt(produtoForm.estoque_minimo),
      });
      await carregarProdutos();
      limparProdutoForm();
    } catch (e) {
      alert(e?.response?.data?.error || "Erro ao salvar produto");
    }
  };

  const excluirProduto = async (id) => {
    if (!window.confirm("Excluir este produto?")) return;
    try {
      await API.delete(`/produtos/${id}`);
      await carregarProdutos();
    } catch (e) {
      alert(e?.response?.data?.error || "Erro ao excluir produto");
    }
  };

  const buscar = async (e) => {
    e?.preventDefault();
    await carregarProdutos(q);
  };

   ///////////////    gestão do estoque    ///////////////
  const [movProdutoId, setMovProdutoId] = useState("");
  const [movTipo, setMovTipo] = useState("entrada"); 
  const [movQuantidade, setMovQuantidade] = useState("");
  const [movData, setMovData] = useState(""); 
  const [movObs, setMovObs] = useState("");

  const enviarMovimentacao = async () => {
    if (!user) return alert("Faça login.");
    if (!movProdutoId) return alert("Selecione um produto.");
    if (!["entrada", "saida"].includes(movTipo)) return alert("Tipo inválido.");
    const qtd = toInt(movQuantidade);
    if (!(qtd > 0)) return alert("Informe uma quantidade > 0.");

    try {
      const payload = {
        produto_id: Number(movProdutoId),
        usuario_id: user.id,
        tipo: movTipo,
        quantidade: qtd,
        data_movimentacao: notEmpty(movData) ? new Date(movData).toISOString() : null, // 7.1.3
        observacao: notEmpty(movObs) ? movObs.trim() : null,
      };
      const { data } = await API.post("/movimentacoes", payload);
      alert("Movimentação registrada com sucesso.");
      if (data?.produto?.abaixo_do_minimo) {
        alert("⚠️ Estoque abaixo do mínimo para este produto!");
      }
    
      await carregarProdutos();
      setMovQuantidade("");
      setMovObs("");
    } catch (e) {
      alert(e?.response?.data?.error || "Erro ao registrar movimentação");
    }
  };

  
  return (
    <div className="app-container">
  
      {view === "login" && (
        <section className="form" aria-label="login">
          <h2>Login</h2>
          <div className="input-container">
            <label>Email</label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="eduardo@gmail.com"
              required
            />
          </div>
          <div className="input-container">
            <label>Senha</label>
            <input
              type="password"
              value={loginSenha}
              onChange={(e) => setLoginSenha(e.target.value)}
              placeholder=" * * * *"
              required
            />
          </div>
          <button onClick={doLogin}>Entrar</button>
        </section>
      )}

      {/* HOME (5) */}
      {view === "home" && (
        <section className="form" aria-label="home">
          <h2>Olá, {user?.nome}</h2>
          <div className="div-botoes" >
            <button onClick={() => setView("produtos")}>Cadastro de Produto</button>
            <button onClick={() => setView("estoque")}>Gestão de Estoque</button>
            <button onClick={logout}>Sair</button>
          </div>
        </section>
      )}

      {view === "produtos" && (
        <section className="form" aria-label="produtos">
          <h2>Cadastro de Produto</h2>

          <form  className="form-cadastro-produto" onSubmit={buscar} >
            <input
              type="text"
              placeholder="Buscar por nome (ex.: Chave de fenda)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button type="submit">Buscar</button>
            <button type="button" onClick={() => { setQ(""); carregarProdutos(""); }}>
              Limpar
            </button>
          </form>

          <div className="div-info-produto-cadastro">
            <div className="input-container">
              <label>Nome</label>
              <input
                type="text"
                value={produtoForm.nome}
                onChange={(e) => setProdutoForm((s) => ({ ...s, nome: e.target.value }))}
                placeholder='ex.: "Martelo, Alicate, etc."'
                required
              />
            </div>
            <div className="input-container">
              <label>Quantidade</label>
              <input
                type="number"
                value={produtoForm.quantidade}
                onChange={(e) => setProdutoForm((s) => ({ ...s, quantidade: e.target.value }))}
                min={0}
              />
            </div>
            <div className="input-container">
              <label>Estoque mínimo</label>
              <input
                type="number"
                value={produtoForm.estoque_minimo}
                onChange={(e) => setProdutoForm((s) => ({ ...s, estoque_minimo: e.target.value }))}
                min={0}
              />
            </div>

            <div className="div-botoes-cadastro" >
              {editandoId ? (
                <>
                  <button type="button" onClick={salvarProduto}>Salvar alterações</button>
                  <button type="button" onClick={limparProdutoForm}>Cancelar</button>
                </>
              ) : (
                <button type="button" onClick={criarProduto}>Cadastrar produto</button>
              )}
              <button type="button" onClick={() => setView("home")}>Voltar</button>
            </div>
          </div>

          <div className="div-lista" >
            {loadingProdutos && <p>Carregando...</p>}
            {!loadingProdutos && (
              <table className="info-lista" >
                <thead>
                  <tr>
                    <th className="infos-da-lista" >Nome</th>
                    <th>Qtd</th>
                    <th>Mín</th>
                    <th>Alerta</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosOrdenados.map((p) => (
                    <tr key={p.id}>
                      <td>{p.nome}</td>
                      <td style={{ textAlign: "center" }}>{p.quantidade}</td>
                      <td style={{ textAlign: "center" }}>{p.estoque_minimo}</td>
                      <td style={{ textAlign: "center" }}>
                        {p.quantidade < p.estoque_minimo ? "⚠️" : "—"}
                      </td>
                      <td style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button className="button-editar" onClick={() => iniciarEdicao(p)}>Editar</button>
                        <button className="button-excluir" onClick={() => excluirProduto(p.id)}>Excluir</button>
                      </td>
                    </tr>
                  ))}
                  {produtosOrdenados.length === 0 && (
                    <tr><td colSpan={5}>Nenhum produto.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

   
      {view === "estoque" && (
        <section className="form" aria-label="estoque">
          <h2>Gestão de Estoque</h2>

          <div >
            <h3>Produtos (ordem alfabética)</h3>
            <ul >
              {produtosOrdenados.map((p) => (
                <li key={p.id} >
                  <span >{p.nome}</span>
                  <span>Qtd: <b>{p.quantidade}</b></span>
                  <span>Mín: <b>{p.estoque_minimo}</b></span>
                  <span>{p.quantidade < p.estoque_minimo ? "⚠️" : ""}</span>
                </li>
              ))}
            </ul>
          </div>

          <div >
            <h3>Registrar movimentação</h3>
            <div className="input-container">
              <label>Produto</label>
              <select
                value={movProdutoId}
                onChange={(e) => setMovProdutoId(e.target.value)}>
                <option value="">Ferramentas :</option>
                {produtosOrdenados.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="input-container">
              <label>Tipo</label>
              <div className="tipos">
                <label><input type="radio" name="tipo" value="entrada" checked={movTipo === "entrada"} onChange={(e) => setMovTipo(e.target.value)} /> Entrada</label>
                <label><input type="radio" name="tipo" value="saida" checked={movTipo === "saida"} onChange={(e) => setMovTipo(e.target.value)} /> Saída</label>
              </div>
            </div>

            <div className="input-container">
              <label>Quantidade</label>
              <input
                type="number"
                min={1}
                value={movQuantidade}
                onChange={(e) => setMovQuantidade(e.target.value)}
                placeholder="Ex.: 12"
              />
            </div>

            <div className="input-container">
              <label>Data da movimentação</label>
              <input
                type="date"
                value={movData}
                onChange={(e) => setMovData(e.target.value)}
              />
            </div>

            <div className="input-container">
              <label>Observação (opcional)</label>
              <input
                type="text"
                value={movObs}
                onChange={(e) => setMovObs(e.target.value)}
                placeholder="Ex.: retirada para reparos"
              />
            </div>

            <div className="div-botoes-registro">
              <button type="button" onClick={enviarMovimentacao}>Registrar</button>
              <button type="button" onClick={() => setView("home")}>Voltar</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
