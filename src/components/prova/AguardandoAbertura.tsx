"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Contagem regressiva até a prova abrir, com recarga automática na hora certa.
 *
 * O tempo restante vem calculado do servidor, não de `new Date()` no
 * navegador: assim o relógio errado do computador do aluno não adianta nem
 * atrasa a liberação.
 */
export default function AguardandoAbertura({
  msParaAbrir,
  abreEmTexto,
}: {
  msParaAbrir: number;
  abreEmTexto: string;
}) {
  const router = useRouter();
  const montadoEm = useRef(Date.now());
  const [restante, setRestante] = useState(msParaAbrir);

  useEffect(() => {
    const id = setInterval(() => {
      const decorrido = Date.now() - montadoEm.current;
      const novo = msParaAbrir - decorrido;
      setRestante(novo);

      // Passou da hora: pede a página de novo ao servidor. Se por algum
      // segundo de diferença ele ainda considerar fechada, tenta outra vez.
      if (novo <= 0 && Math.floor(-novo / 1000) % 5 === 0) router.refresh();
    }, 1000);
    return () => clearInterval(id);
  }, [msParaAbrir, router]);

  if (restante <= 0) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-900">
        Liberando a prova...
      </p>
    );
  }

  const total = Math.floor(restante / 1000);
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;
  const dois = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-center">
      <p className="text-sm text-amber-900">Esta prova ainda não foi liberada.</p>
      <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-amber-900">
        {horas > 0 && `${dois(horas)}:`}
        {dois(minutos)}:{dois(segundos)}
      </p>
      <p className="mt-2 text-xs text-amber-800/80">
        Abre em {abreEmTexto}. Deixe esta página aberta: ela libera sozinha na hora.
      </p>
    </div>
  );
}
