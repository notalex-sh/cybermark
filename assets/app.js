const editor = CodeMirror.fromTextArea(document.getElementById('codeInput'), {
    mode: 'javascript',
    theme: 'material-darker',
    lineNumbers: true,
    lineWrapping: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    indentUnit: 2,
    tabSize: 2,
    value: `const enhance = () => {
  document.documentElement.style.scrollBehavior = 'smooth';
  
  document.querySelectorAll('p, li').forEach(el => {
    el.style.lineHeight = '1.6';
  });
  
  document.querySelectorAll('img').forEach((img, i) => {
    img.style.transition = 'transform 0.3s';
    img.style.cursor = 'pointer';
    img.onclick = () => {
      img.style.transform = 
        img.style.transform === 'scale(1.5)' 
          ? 'scale(1)' 
          : 'scale(1.5)';
    };
  });
  
  console.log('✨ Page enhanced by CyberMark');
};

enhance();`
});

function simpleMinify(code) {
    return code
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}();,:])\s*/g, '$1')
        .trim();
}

function generateBookmarklet() {
    const button = event.target;
    button.disabled = true;

    button.innerHTML = `
                <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Generating...
            `;

    setTimeout(() => {
        const code = editor.getValue();
        const name = document.getElementById('bookmarkletName').value || 'Bookmarklet';
        const scripts = document.getElementById('externalScripts').value.split('\n').filter(s => s.trim());
        const styles = document.getElementById('externalStyles').value.split('\n').filter(s => s.trim());

        const shouldMinify = document.getElementById('uglifyCode').checked;
        const shouldWrapIIFE = document.getElementById('wrapIIFE').checked;
        const shouldEncode = document.getElementById('encodeURI').checked;

        let finalCode = code;

        if (styles.length > 0) {
            let styleCode = '';
            styles.forEach(styleUrl => {
                const loadOnce = styleUrl.includes('!loadOnce');
                const url = styleUrl.replace('!loadOnce', '').trim();
                const id = `bm_style_${btoa(url).substring(0, 8)}`;

                if (loadOnce) {
                    styleCode += `if(!document.getElementById("${id}")){`;
                }
                styleCode += `var l=document.createElement("link");`;
                if (loadOnce) {
                    styleCode += `l.id="${id}";`;
                }
                styleCode += `l.rel="stylesheet";l.href="${url}";document.head.appendChild(l);`;
                if (loadOnce) {
                    styleCode += `}`;
                }
            });
            finalCode = styleCode + finalCode;
        }

        if (scripts.length > 0) {
            scripts.reverse().forEach(scriptUrl => {
                const loadOnce = scriptUrl.includes('!loadOnce');
                const url = scriptUrl.replace('!loadOnce', '').trim();
                const id = `bm_script_${btoa(url).substring(0, 8)}`;

                let scriptCode = '';
                if (loadOnce) {
                    scriptCode = `if(!document.getElementById("${id}")){`;
                }
                scriptCode += `var s=document.createElement("script");`;
                if (loadOnce) {
                    scriptCode += `s.id="${id}";`;
                }
                scriptCode += `s.src="${url}";s.onload=function(){${finalCode}};document.body.appendChild(s);`;
                if (loadOnce) {
                    scriptCode += `}else{${finalCode}}`;
                } else {
                    scriptCode += '';
                }

                finalCode = scriptCode;
            });
        }

        const originalSize = finalCode.length;

        if (shouldMinify) {
            finalCode = simpleMinify(finalCode);
        }

        if (shouldWrapIIFE) {
            finalCode = `(function(){${finalCode}})()`;
        }

        if (shouldEncode) {
            finalCode = `javascript:${encodeURIComponent(finalCode)}`;
        } else {
            finalCode = `javascript:${finalCode}`;
        }

        document.getElementById('outputCode').textContent = finalCode;
        document.getElementById('bookmarkletLink').href = finalCode;
        document.getElementById('bookmarkletLinkText').textContent = name;
        document.getElementById('originalSize').textContent = `${originalSize} bytes`;
        document.getElementById('compressedSize').textContent = `${finalCode.length} bytes`;

        const reduction = Math.round((1 - finalCode.length / originalSize) * 100);
        document.getElementById('reduction').textContent = `${reduction}%`;

        const outputSection = document.getElementById('outputSection');
        outputSection.style.opacity = '1';
        outputSection.classList.add('animate-up');

        button.disabled = false;
        button.innerHTML = `
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    Generate Bookmarklet
                `;
    }, 500);
}

function copyCode() {
    const code = document.getElementById('outputCode').textContent;
    navigator.clipboard.writeText(code).then(() => {
        const toast = document.getElementById('copyToast');
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    });
}

setTimeout(() => {
    const button = document.querySelector('button');
    button.click();
}, 1000);
