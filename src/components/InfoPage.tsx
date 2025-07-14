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
        <h1>🇧🇬 Информация за NBGN проекта</h1>

        {/* Project Information Section */}
        <section className="info-section">
          <h2>
            <i className="fas fa-info-circle mr-2"></i>Какво е NBGN?
          </h2>
          <div className="info-card">
            <p>
              NBGN (Новият български лев) е експериментален криптографски токен,
              който имитира българския лев в децентрализираната екосистема.
              Проектът е създаден с образователна цел и демонстрира как
              традиционните валути могат да бъдат представени в блокчейн
              средата.
            </p>
            <ul>
              <li>
                <strong>Фиксиран курс:</strong> 1 EUR = 1.9558 NBGN (като при
                BGN)
              </li>
              <li>
                <strong>Мрежа:</strong> Arbitrum One за ниски такси и бързи
                трансакции
              </li>
              <li>
                <strong>Обвързан с EURe:</strong> Стабилен токен, обезпечен с
                евро
              </li>
              <li>
                <strong>Образователен характер:</strong> Не е официална валута
                или инвестиция
              </li>
            </ul>
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
                <strong>Общност:</strong> Създаване на българска крипто общност
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
              <h4>3️⃣ Смени ETH ➜ EURe (крипто-евро)</h4>
              <p>
                Отвори <strong>Uniswap/1inch</strong> на Arbitrum.
                <br />
                Swap колкото ти трябва (примерно 10 EURe).
                <br />
                <em>EURe e €-стейбълкойн, нужен за купуване на NBGN.</em>
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
