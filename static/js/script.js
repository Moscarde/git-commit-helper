document.addEventListener("DOMContentLoaded", function () {
	const generateBtn = document.getElementById("generate-btn");
	const copyBtn = document.getElementById("copy-btn");
	const commitInput = document.getElementById("commit-input");
	const resultContainer = document.getElementById("result-container");
	const resultElement = document.getElementById("result");
	const loadingElement = document.getElementById("loading");
	const languageRadios = document.getElementsByName("language");
	const themeToggle = document.getElementById("theme-toggle");

	// Função para gerar o commit
	async function generateCommit() {
		const text = commitInput.value.trim();
		if (!text) {
			alert("Por favor, insira uma descrição ou código para gerar o commit.");
			return;
		}

		// Obter o idioma selecionado
		let language = "english";
		for (const radio of languageRadios) {
			if (radio.checked) {
				language = radio.value;
				break;
			}
		}

		// Mostrar loading e esconder resultados anteriores
		loadingElement.classList.remove("hidden");
		resultContainer.classList.add("hidden");
		copyBtn.disabled = true;

		try {
			const response = await fetch("/generate-commit", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					text: text,
					language: language
				})
			});

			const data = await response.json();

			// Esconder loading e mostrar resultado
			loadingElement.classList.add("hidden");

			if (data.error) {
				resultElement.textContent = `Erro: ${data.error}`;
			} else {
				resultElement.textContent = data.message;
				copyBtn.disabled = false;
			}

			resultContainer.classList.remove("hidden");
		} catch (error) {
			loadingElement.classList.add("hidden");
			resultElement.textContent = `Erro ao conectar ao servidor: ${error.message}`;
			resultContainer.classList.remove("hidden");
		}
	}

	// Adicionar evento para o botão de geração
	generateBtn.addEventListener("click", generateCommit);

	// Adicionar evento para pressionar Enter na caixa de texto
	commitInput.addEventListener("keydown", function (event) {
		// Verificar se a tecla pressionada foi Enter sem a tecla Shift
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault(); // Previne a quebra de linha padrão
			generateCommit();
		}
	});

	// Função para copiar o commit para a área de transferência
	copyBtn.addEventListener("click", function () {
		const commitMessage = resultElement.textContent;
		navigator.clipboard
			.writeText(commitMessage)
			.then(() => {
				const originalText = copyBtn.textContent;
				copyBtn.textContent = "Copiado!";

				setTimeout(() => {
					copyBtn.textContent = originalText;
				}, 1500);
			})
			.catch((err) => {
				console.error("Erro ao copiar: ", err);
				alert("Não foi possível copiar o texto. Por favor, copie manualmente.");
			});
	});

	// Função para alternar o tema
	function toggleTheme() {
		const htmlElement = document.documentElement;
		const currentTheme = htmlElement.getAttribute("data-theme");
		const newTheme = currentTheme === "dark" ? "light" : "dark";

		htmlElement.setAttribute("data-theme", newTheme);
		localStorage.setItem("theme", newTheme);
	}

	// Configurar o tema inicial com base na preferência salva
	function setInitialTheme() {
		const savedTheme = localStorage.getItem("theme");
		if (savedTheme) {
			document.documentElement.setAttribute("data-theme", savedTheme);
		} else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
			// Se não houver tema salvo mas o sistema preferir modo escuro
			document.documentElement.setAttribute("data-theme", "dark");
		}
	}

	// Adicionar evento para o botão de alternar tema
	themeToggle.addEventListener("click", toggleTheme);

	// Configurar o tema inicial
	setInitialTheme();
});
