import React, { useState } from 'react';
import './HelloBeatree.css';

const HelloBeatree = () => {
  // React Hook: 상태(state) 관리
  const [clickCount, setClickCount] = useState(0);
  const [message, setMessage] = useState('안녕하세요! 첫 번째 React 컴포넌트입니다 🎵');

  // 버튼 클릭 시 실행되는 함수
  const handleClick = () => {
    setClickCount(clickCount + 1);
    
    if (clickCount === 0) {
      setMessage('좋아요! React를 배우고 있네요 🚀');
    } else if (clickCount === 1) {
      setMessage('이제 Beatree 개발을 시작해볼까요? 🎶');
    } else if (clickCount === 2) {
      setMessage('Spotify API 연동이 기대되네요! 🔥');
    } else {
      setMessage(`${clickCount + 1}번 클릭하셨어요! 개발자의 길로... 👨‍💻`);
    }
  };

  return (
    <div className="hello-beatree">
      <div className="container">
        <h1 className="title">🎵 Beatree 개발 시작!</h1>
        
        <div className="message-box">
          <p className="message">{message}</p>
        </div>
        
        <button 
          className="click-button"
          onClick={handleClick}
        >
          클릭해보세요! ({clickCount}번 클릭됨)
        </button>
        
        <div className="info-section">
          <h3>🔍 지금 배우고 있는 React 개념들:</h3>
          <ul>
            <li><strong>useState</strong>: 상태 관리 (clickCount, message)</li>
            <li><strong>이벤트 핸들링</strong>: onClick으로 버튼 클릭 처리</li>
            <li><strong>조건부 렌더링</strong>: clickCount에 따라 다른 메시지 표시</li>
            <li><strong>JSX</strong>: JavaScript 안에 HTML 같은 문법 사용</li>
          </ul>
        </div>
        
        <div className="next-steps">
          <h3>🚀 다음 단계:</h3>
          <ol>
            <li>Spotify Developer 계정 생성</li>
            <li>OAuth 로그인 구현</li>
            <li>음악 검색 API 연동</li>
            <li>Audio Features 활용</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default HelloBeatree;