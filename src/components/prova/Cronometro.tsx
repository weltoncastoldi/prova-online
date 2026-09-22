"use client";

import { useEffect, useState } from "react";

/**
 * Relógio da prova. É só a parte visível: quem decide se o tempo acabou é o
 * servidor, comparando iniciada_em com o limite da avaliação. Mexer no relógio
 * do computador não rende tempo extra.
 */
export default function Cronometro({ fim, token }: { fim: number; token: string }) {
  const [restante, setRestante] = useState(() => Math.max(0, fim - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      const novo = Math.max(0, fim - Date.now());
      setRestante(novo);
      if (novo === 0) window.location.href = `/resultado/${token}`;
    }, 1000);
    return () => clearInterval(id);
  }, [fim, token]);

  const totalSegundos = Math.floor(restante / 1000);
  const minutos = String(Math.floor(totalSegundos / 60)).padStart(2, "0");
  const segundos = String(totalSegundos % 60).padStart(2, "0");
  const acabando = totalSegundos <= 300;

  return (
    <span
      role="timer"
      aria-live="off"
      className={`rounded-lg px-2.5 py-1 font-mono text-sm font-semibold tabular-nums ${
        acabando ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
      }`}
    >
      {minutos}:{segundos}
    </span>
  );
}
