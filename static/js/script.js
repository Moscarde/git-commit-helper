document.addEventListener("DOMContentLoaded", function () {
	const generateBtn = document.getElementById("generate-btn");
	const copyBtn = document.getElementById("copy-btn");
	const commitInput = document.getElementById("commit-input");
	const resultContainer = document.getElementById("result-container");
	const resultElement = document.getElementById("result");
	const loadingElement = document.getElementById("loading");
	const languageRadios = document.getElementsByName("language");
	const themeToggle = document.getElementById("theme-toggle");
	const patternText = document.getElementById("pattern-text");
	const exampleText = document.getElementById("example-text");
	const charCount = document.getElementById("char-count");
	const limitModal = document.getElementById("limit-modal");
	const closeModalBtn = document.getElementById("close-modal-btn");
	const closeModalX = document.querySelector(".close-modal");
	const modalTitle = document.getElementById("modal-title");
	const modalMessage = document.getElementById("modal-message");

	// Conteúdo multilíngue
	const content = {
		english: {
			pattern: "Pattern: <code>&lt;type&gt;: &lt;description&gt;</code>",
			examples: "Examples: <code>feat: add login functionality</code> | <code>fix: resolve null pointer exception</code>",
			placeholder: "Describe your changes or paste your code here...",
			generateButton: "Generate Commit",
			copyButton: "Copy",
			resultTitle: "Commit Message:",
			loading: "Generating commit...",
			copiedText: "Copied!",
			errorEmpty: "Please enter a description or code to generate a commit.",
			errorServer: "Error connecting to server: "
		},
		portuguese: {
			pattern: "Padrão: <code>&lt;type&gt;: &lt;description&gt;</code>",
			examples: "Exemplos: <code>feat: adicionar funcionalidade de login</code> | <code>fix: resolver exceção de ponteiro nulo</code>",
			placeholder: "Descreva suas alterações ou cole seu código aqui...",
			generateButton: "Gerar Commit",
			copyButton: "Copiar",
			resultTitle: "Mensagem de Commit:",
			loading: "Gerando commit...",
			copiedText: "Copiado!",
			errorEmpty: "Por favor, insira uma descrição ou código para gerar o commit.",
			errorServer: "Erro ao conectar ao servidor: "
		}
	};

	// Função para atualizar o idioma da interface
	function updateLanguage(language) {
		const langContent = content[language];

		// Atualizar textos estáticos
		patternText.innerHTML = langContent.pattern;
		exampleText.innerHTML = langContent.examples;
		commitInput.placeholder = langContent.placeholder;
		generateBtn.textContent = langContent.generateButton;
		copyBtn.textContent = langContent.copyButton;

		document.querySelector(".result-header h3").textContent = langContent.resultTitle;
		document.querySelector(".loading p").textContent = langContent.loading;
	}

	// Adicionar eventos para os radio buttons de idioma
	languageRadios.forEach((radio) => {
		radio.addEventListener("change", function () {
			updateLanguage(this.value);
		});
	});

	// Contador de caracteres
	commitInput.addEventListener("input", function () {
		const currentLength = commitInput.value.length;
		charCount.textContent = currentLength;

		const charCounter = document.querySelector(".char-counter");
		charCounter.classList.remove("limit-near", "limit-reached");

		if (currentLength >= 400 && currentLength < 500) {
			charCounter.classList.add("limit-near");
		} else if (currentLength >= 500) {
			charCounter.classList.add("limit-reached");
		}
	});

	// Função para verificar o limite de uso
	async function checkUsageLimit() {
		try {
			const response = await fetch("/check-limit");
			const data = await response.json();

			if (data.limit_reached) {
				showLimitExceededModal(data.daily_limit);
			}
		} catch (error) {
			console.error("Erro ao verificar limite de uso:", error);
		}
	}

	// Função para mostrar o modal de limite excedido
	function showLimitExceededModal(dailyLimit) {
		// Configurar conteúdo baseado no idioma selecionado
		let selectedLanguage = "english";
		for (const radio of languageRadios) {
			if (radio.checked) {
				selectedLanguage = radio.value;
				break;
			}
		}

		if (selectedLanguage === "english") {
			modalTitle.textContent = "Daily Usage Limit Exceeded";
			modalMessage.innerHTML = `You have reached the limit of <strong>${dailyLimit} commit generations</strong> for today.`;
		} else {
			modalTitle.textContent = "Limite de Uso Diário Excedido";
			modalMessage.innerHTML = `Você atingiu o limite de <strong>${dailyLimit} gerações de commit</strong> para hoje.`;
		}

		// Mostrar o modal
		limitModal.classList.remove("hidden");
	}

	// Funções para fechar o modal
	function closeModal() {
		limitModal.classList.add("hidden");
	}

	closeModalBtn.addEventListener("click", closeModal);
	closeModalX.addEventListener("click", closeModal);

	// Fechar modal ao clicar fora dele
	limitModal.addEventListener("click", function (e) {
		if (e.target === limitModal) {
			closeModal();
		}
	});

	// Função para gerar o commit
	async function generateCommit() {
		const text = commitInput.value.trim();
		let selectedLanguage = "english";

		for (const radio of languageRadios) {
			if (radio.checked) {
				selectedLanguage = radio.value;
				break;
			}
		}

		const langContent = content[selectedLanguage];

		if (!text) {
			alert(langContent.errorEmpty);
			return;
		}

		// Verificar o limite de caracteres
		if (text.length > 500) {
			alert(selectedLanguage === "english" ? "Text exceeds the 500 character limit." : "O texto excede o limite de 500 caracteres.");
			return;
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
					language: selectedLanguage
				})
			});

			const data = await response.json();

			// Esconder loading e mostrar resultado
			loadingElement.classList.add("hidden");

			// Verificar se o limite foi excedido
			if (response.status === 429 || data.limit_exceeded) {
				showLimitExceededModal(data.daily_limit || 3);
				return;
			}

			if (data.error) {
				resultElement.textContent = `Erro: ${data.error}`;
			} else {
				resultElement.textContent = data.message;
				copyBtn.disabled = false;
			}

			resultContainer.classList.remove("hidden");
		} catch (error) {
			loadingElement.classList.add("hidden");
			resultElement.textContent = `${langContent.errorServer}${error.message}`;
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
		let selectedLanguage = "english";

		for (const radio of languageRadios) {
			if (radio.checked) {
				selectedLanguage = radio.value;
				break;
			}
		}

		const langContent = content[selectedLanguage];

		navigator.clipboard
			.writeText(commitMessage)
			.then(() => {
				const originalText = copyBtn.textContent;
				copyBtn.textContent = langContent.copiedText;

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
		} else {
			// Usar tema escuro como padrão
			document.documentElement.setAttribute("data-theme", "dark");
		}
	}

	// Adicionar evento para o botão de alternar tema
	themeToggle.addEventListener("click", toggleTheme);

	// Configurar o tema inicial
	setInitialTheme();

	// Inicializar com o idioma selecionado
	let initialLanguage = "english";
	for (const radio of languageRadios) {
		if (radio.checked) {
			initialLanguage = radio.value;
			break;
		}
	}
	updateLanguage(initialLanguage);

	// Inicializar contador
	charCount.textContent = commitInput.value.length;

	// Verificar limite de uso ao carregar a página
	checkUsageLimit();

	// Botão de debug para testar o modal
	const debugShowModalBtn = document.getElementById("debug-show-modal");
	if (debugShowModalBtn) {
		debugShowModalBtn.addEventListener("click", function () {
			showLimitExceededModal(3 || 3);
		});
	}
});
