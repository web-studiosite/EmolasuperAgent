let agents = JSON.parse(localStorage.getItem("agents")) || []
let sales = JSON.parse(localStorage.getItem("sales")) || []

function save() {
  localStorage.setItem("agents", JSON.stringify(agents))
  localStorage.setItem("sales", JSON.stringify(sales))
}

function addAgent() {
  const name = document.getElementById("agentName").value
  if (!name) return

  agents.push({
    id: Date.now().toString(),
    name
  })

  document.getElementById("agentName").value = ""
  save()
  render()
}

function addSale() {
  const agentId = document.getElementById("agentSelect").value
  const amount = Number(document.getElementById("amount").value)

  if (!agentId || !amount) return

  sales.push({
    id: Date.now().toString(),
    agentId,
    amount
  })

  document.getElementById("amount").value = ""
  save()
  render()
}

function calculateCommissions() {
  const commissions = {}

  sales.forEach(sale => {
    commissions[sale.agentId] =
      (commissions[sale.agentId] || 0) + sale.amount * 0.1
  })

  return commissions
}

function render() {
  const agentList = document.getElementById("agentList")
  const select = document.getElementById("agentSelect")
  const commissionList = document.getElementById("commissionList")

  agentList.innerHTML = ""
  select.innerHTML = ""

  agents.forEach(a => {
    const li = document.createElement("li")
    li.textContent = a.name
    agentList.appendChild(li)

    const option = document.createElement("option")
    option.value = a.id
    option.textContent = a.name
    select.appendChild(option)
  })

  const commissions = calculateCommissions()
  commissionList.innerHTML = ""

  for (let id in commissions) {
    const agent = agents.find(a => a.id === id)
    const li = document.createElement("li")
    li.textContent = `${agent?.name}: ${commissions[id].toFixed(2)}`
    commissionList.appendChild(li)
  }
}

render()
