import React from 'react';
import { Link } from 'react-router-dom';

export const InfoPage: React.FC = () => {
  return (
    <div className="info-page">
      <div className="info-header">
        <Link to="/" className="back-link">
          <i className="fas fa-arrow-left mr-2"></i>
          Обратно към началото
        </Link>
      </div>

      <div className="info-content">
        <h1>🌍 Информация за NBGN, DBGN и GBGN токените</h1>

        {/* Overview Section */}
        <section className="info-section">
          <h2>
            <i className="fas fa-coins mr-2"></i>Преглед на токените
          </h2>
          <div className="info-card">
            <p>
              Семейството от токени включва три различни актива, всеки обвързан
              с различна стойност:
            </p>
            <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
              {/* NBGN Card */}
              <div
                style={{
                  padding: '20px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '8px',
                  border: '2px solid #1E88E5',
                }}
              >
                <h3 style={{ color: '#1E88E5', marginTop: 0 }}>
                  🇧🇬 NBGN - Новият лев
                </h3>
                <ul style={{ marginBottom: 0 }}>
                  <li>
                    <strong>Обвързан с:</strong> EUR (Евро)
                  </li>
                  <li>
                    <strong>Курс:</strong> 1 EUR = 1.95583 NBGN
                  </li>
                  <li>
                    <strong>Мрежа:</strong> Arbitrum One
                  </li>
                  <li>
                    <strong>Стабилна монета:</strong> EURe
                  </li>
                  <li>
                    <strong>Адрес:</strong>{' '}
                    <code style={{ fontSize: '12px' }}>
                      0x47F9CF7043C8A059f82a988C0B9fF73F0c3e6067
                    </code>
                  </li>
                </ul>
              </div>

              {/* DBGN Card */}
              <div
                style={{
                  padding: '20px',
                  backgroundColor: '#e8f5e9',
                  borderRadius: '8px',
                  border: '2px solid #43A047',
                }}
              >
                <h3 style={{ color: '#43A047', marginTop: 0 }}>
                  💵 DBGN - Доларов лев
                </h3>
                <ul style={{ marginBottom: 0 }}>
                  <li>
                    <strong>Обвързан с:</strong> USD (Щатски долар)
                  </li>
                  <li>
                    <strong>Курс:</strong> 1 USD = 1.6667 DBGN (0.60 USD per
                    DBGN)
                  </li>
                  <li>
                    <strong>Мрежа:</strong> Arbitrum One
                  </li>
                  <li>
                    <strong>Стабилна монета:</strong> USDC
                  </li>
                  <li>
                    <strong>Адрес:</strong>{' '}
                    <code style={{ fontSize: '12px' }}>
                      0x144bc6785d4bBC450a736f0e0AC6d2B551a1eDB6
                    </code>
                  </li>
                </ul>
              </div>

              {/* GBGN Card */}
              <div
                style={{
                  padding: '20px',
                  backgroundColor: '#fffde7',
                  borderRadius: '8px',
                  border: '2px solid #FFD700',
                }}
              >
                <h3 style={{ color: '#F57C00', marginTop: 0 }}>
                  🏆 GBGN - Златен лев
                </h3>
                <ul style={{ marginBottom: 0 }}>
                  <li>
                    <strong>Обвързан с:</strong> PAXG (Токенизирано злато)
                  </li>
                  <li>
                    <strong>Курс:</strong> 1 PAXG = 5,600 GBGN
                  </li>
                  <li>
                    <strong>Мрежа:</strong> Ethereum Mainnet
                  </li>
                  <li>
                    <strong>Стабилна монета:</strong> PAXG (1 PAXG = 1 тройунция
                    злато)
                  </li>
                  <li>
                    <strong>Адрес:</strong> <em>Предстои внедряване</em>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="info-section">
          <h2>
            <i className="fas fa-cogs mr-2"></i>Технология и сигурност
          </h2>
          <div className="info-card">
            <p>
              NBGN използва най-съвременните блокчейн технологии за сигурност и
              прозрачност:
            </p>
            <ul>
              <li>
                <strong>Smart Contract:</strong> Верифициран код на Arbitrum
              </li>
              <li>
                <strong>Децентрализация:</strong> Без централен контрол
              </li>
              <li>
                <strong>Прозрачност:</strong> Всички трансакции са публично
                видими
              </li>
              <li>
                <strong>Interoperability:</strong> Съвместим с DeFi екосистемата
              </li>
            </ul>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="info-section">
          <h2>
            <i className="fas fa-lightbulb mr-2"></i>Приложения
          </h2>
          <div className="info-card">
            <ul>
              <li>
                <strong>Образование:</strong> Учене на блокчейн технологии
              </li>
              <li>
                <strong>Експерименти:</strong> Тестване на DeFi протоколи
              </li>
              <li>
                <strong>Демонстрация:</strong> Показване на възможностите на
                Web3
              </li>
              <li>
                <strong>Общност:</strong> Укрепване на българската крипто
                общност
              </li>
            </ul>
          </div>
        </section>

        {/* Practical Guide Section */}
        <section className="info-section guide-section">
          <h2>
            <i className="fas fa-rocket mr-2"></i>Практически гид
          </h2>
          <div className="guide-intro">
            <h3>🚀 Готов(а) ли си за безсмърния български лев?</h3>
            <p>
              Новият лев (NBGN) вече може да бъде лесно закупен и използван от
              всеки.
              <br />
              <strong>
                Ето кратък 👉 GUIDE как да започнеш за по-малко от 10 мин:
              </strong>
            </p>
          </div>

          <div className="guide-steps">
            <div className="guide-step">
              <h4>1️⃣ Подготви портфейла си</h4>
              <p>
                <strong>MetaMask</strong> → смени блокчейна на{' '}
                <strong>Arbitrum One</strong>.
                <br />
                Добави NBGN ръчно, за да виждаш баланса в портфейла си:
                <br />
                <code className="contract-address">
                  0x47F9CF7043C8A059f82a988C0B9fF73F0c3e6067
                </code>
              </p>
            </div>

            <div className="guide-step">
              <h4>2️⃣ Осигури си малко ETH в Arbitrum</h4>
              <p>
                <strong>🌉 Bridge:</strong> прехвърли ETH от Ethereum Mainnet
                към Arbitrum през официалния Arbitrum Bridge или купи през
                <br />
                <strong>🏦 CEX</strong> (Binance, OKX, Bitget и др.): изтегли
                директно на Arbitrum One мрежата.
                <br />
                <em>
                  (Нужни са ти малко центове за gas – обикновено &lt; 0.20 USD.)
                </em>
              </p>
            </div>

            <div className="guide-step">
              <h4>3️⃣ Купи EURe чрез Monerium</h4>
              <p>
                Отиди на <strong>monerium.app</strong> и създай акаунт.
                <br />
                Свържи банковата си сметка и купи EURe директно с евро.
                <br />
                <em>
                  Monerium е лицензиран доставчик на електронни пари в ЕС.
                </em>
              </p>
            </div>

            <div className="guide-step">
              <h4>4️⃣ Посети нашето приложение</h4>
              <p>
                „Connect Wallet" → избери MetaMask.
                <br />
                Потвърди достъп до EURe (Approve).
                <br />
                <strong>Купи NBGN:</strong> 1 EURe = 1.95583 NBGN (фиксирано с
                валутен борд, точно като BGN/€).
              </p>
            </div>

            <div className="guide-step">
              <h4>5️⃣ Какво можеш да правиш в уеб приложението?</h4>
              <ul>
                <li>Купувай / продавай NBGN</li>
                <li>
                  Обменяй NBGN с приятели и търговци за секунди и буквално за
                  стотинки откъм такси
                </li>
                <li>Следи историята на движенията си – всичко е on-chain</li>
              </ul>
            </div>

            <div className="guide-step">
              <h4>6️⃣ Обратно към евро? Лесно.</h4>
              <p>
                В същия интерфейс натисни <strong>Продай</strong>, въвеждаш NBGN
                и получаваш EURe.
                <br />
                <strong>EURe ⇄ EUR</strong> 👉 централизирана борса или банка по
                твой избор.
              </p>
            </div>
          </div>

          <div className="security-tips">
            <h3>⚠️ Съвети за сигурност</h3>
            <ul>
              <li>Провери адресите два пъти преди да подписваш</li>
              <li>Дръж малко допълнителен ETH за комисионни</li>
              <li>
                <strong>Не споделяй seed фразата си с никого!!!</strong>
              </li>
            </ul>
          </div>

          <div className="guide-footer">
            <p>
              <strong>💬 Имаш въпроси?</strong> Свържи се с нас в Discord
              канала.
            </p>
            <p>
              <strong>Нека заедно запазим българския лев! 🇧🇬✨</strong>
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="info-section">
          <h2>
            <i className="fas fa-envelope mr-2"></i>Контакти и връзки
          </h2>
          <div className="info-card">
            <div className="contact-links">
              <a
                href="https://arbiscan.io/token/0x47F9CF7043C8A059f82a988C0B9fF73F0c3e6067"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                <i className="fas fa-search mr-2"></i>
                Преглед в Arbiscan
              </a>
              <a href="/disclaimer" className="contact-link">
                <i className="fas fa-shield-alt mr-2"></i>
                Правен дисклеймър
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
