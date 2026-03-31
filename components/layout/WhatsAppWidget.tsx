'use client';

import { useState } from 'react';

export default function WhatsAppWidget() {
  const [open, setOpen] = useState(false);
  const phone = '551127719911';
  const message = 'Olá! Gostaria de saber mais sobre os brindes personalizados.';

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat popup */}
      {open && (
        <div className="mb-4 bg-white rounded-2xl shadow-2xl w-80 overflow-hidden animate-in">
          {/* Header */}
          <div className="bg-[#075E54] px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.111.547 4.099 1.504 5.834L0 24l6.335-1.652A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.91 0-3.78-.514-5.41-1.487l-.388-.23-4.022 1.05 1.075-3.922-.253-.402A9.786 9.786 0 012.18 12C2.18 6.58 6.58 2.18 12 2.18S21.82 6.58 21.82 12 17.42 21.82 12 21.82z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Brindes Perfeitos</p>
              <p className="text-green-200 text-xs">Online</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat body */}
          <div className="bg-[#ECE5DD] px-4 py-5">
            <div className="bg-white rounded-lg px-4 py-3 shadow-sm max-w-[85%]">
              <p className="text-gray-800 text-sm">Olá! 👋</p>
              <p className="text-gray-800 text-sm mt-1">Como podemos ajudar você?</p>
              <p className="text-gray-400 text-[10px] text-right mt-1">agora</p>
            </div>
          </div>

          {/* Input area */}
          <div className="px-4 py-3 bg-[#F0F0F0]">
            <a
              href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#25D366] text-white text-center py-3 rounded-full font-semibold text-sm hover:bg-[#1DA851] transition-colors"
            >
              Iniciar conversa
            </a>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-16 h-16 bg-[#25D366] rounded-full shadow-lg hover:bg-[#1DA851] transition-all hover:scale-110 flex items-center justify-center"
        aria-label="WhatsApp"
      >
        <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.111.547 4.099 1.504 5.834L0 24l6.335-1.652A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82c-1.91 0-3.78-.514-5.41-1.487l-.388-.23-4.022 1.05 1.075-3.922-.253-.402A9.786 9.786 0 012.18 12C2.18 6.58 6.58 2.18 12 2.18S21.82 6.58 21.82 12 17.42 21.82 12 21.82z"/>
        </svg>
      </button>
    </div>
  );
}
