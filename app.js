// 初始化Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAuYq4BetwW1kQIfxqQtd1Fq3PKzW45hj0",
  authDomain: "hf-poke.firebaseapp.com",
  databaseURL: "https://hf-poke-default-rtdb.firebaseio.com",
  projectId: "hf-poke",
  storageBucket: "hf-poke.firebasestorage.app",
  messagingSenderId: "463196183278",
  appId: "1:463196183278:web:1042a4d15c9f7a47dfb1ff",
  measurementId: "G-29EVDZBZ2W"
};
  
  // 初始化Firebase
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  
  const MAX_TEAM_SIZE = 6;
  let currentRoomId = null;
  let isHost = false;
  let playerRole = null; // 'red' or 'blue'
  let opponentConnected = false;
  
  // DOM元素
  const createRoomBtn = document.getElementById('createRoomBtn');
  const joinRoomBtn = document.getElementById('joinRoomBtn');
  const roomIdInput = document.getElementById('roomIdInput');
  const roomIdDisplay = document.getElementById('roomIdDisplay');
  const playerRoleDisplay = document.getElementById('playerRole');
  const opponentStatusDisplay = document.getElementById('opponentStatus');
  
  // 创建房间
  createRoomBtn.addEventListener('click', () => {
    currentRoomId = generateRoomId();
    isHost = true;
    playerRole = 'red'; // 房主总是红队
    
    roomIdDisplay.textContent = `房间ID: ${currentRoomId}`;
    playerRoleDisplay.textContent = `你的队伍: 红队`;
    
    // 初始化房间数据
    database.ref(`rooms/${currentRoomId}`).set({
      redTeam: {},
      blueTeam: {},
      cardPool: {},
      disabledCards: {},
      hostConnected: true,
      guestConnected: false
    });
    
    setupRoomListeners();
    loadPokemonCards();
  });
  
  // 加入房间
  joinRoomBtn.addEventListener('click', () => {
    currentRoomId = roomIdInput.value.trim();
    if (!currentRoomId) return;
    
    isHost = false;
    playerRole = 'blue'; // 加入者总是蓝队
    
    roomIdDisplay.textContent = `房间ID: ${currentRoomId}`;
    playerRoleDisplay.textContent = `你的队伍: 蓝队`;
    
    // 更新房间状态
    database.ref(`rooms/${currentRoomId}/guestConnected`).set(true);
    
    setupRoomListeners();
    loadPokemonCards();
  });
  
  // 生成随机房间ID
  function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  
  // 设置房间监听器
  function setupRoomListeners() {
    // 监听对手连接状态
    database.ref(`rooms/${currentRoomId}`).on('value', (snapshot) => {
      const roomData = snapshot.val();
      if (!roomData) return;
      
      opponentConnected = isHost ? roomData.guestConnected : roomData.hostConnected;
      opponentStatusDisplay.textContent = opponentConnected ? "对手已连接" : "等待对手连接...";
      
      // 同步卡池和队伍
      if (!isHost) {
        syncTeamsFromFirebase(roomData.redTeam, document.getElementById('redTeam'));
        syncTeamsFromFirebase(roomData.blueTeam, document.getElementById('blueTeam'));
      }
    });
    
    // 监听队伍变化
    database.ref(`rooms/${currentRoomId}/${playerRole === 'red' ? 'blueTeam' : 'redTeam'}`).on('value', (snapshot) => {
      const teamData = snapshot.val();
      const opponentTeam = playerRole === 'red' ? document.getElementById('blueTeam') : document.getElementById('redTeam');
      syncTeamsFromFirebase(teamData, opponentTeam);
    });
    
    // 监听禁用卡片变化
    database.ref(`rooms/${currentRoomId}/disabledCards`).on('value', (snapshot) => {
      const disabledCards = snapshot.val() || {};
      updateDisabledCards(disabledCards);
    });
  }
  
  // 从Firebase同步队伍状态
  function syncTeamsFromFirebase(teamData, teamElement) {
    if (!teamData) return;
    
    teamElement.innerHTML = '';
    Object.keys(teamData).forEach(cardId => {
      const card = document.getElementById(cardId);
      if (card) {
        moveToTeam(card, teamElement, false); // false表示不触发Firebase更新
      }
    });
  }
  
  // 更新禁用卡片状态
  function updateDisabledCards(disabledCards) {
    document.querySelectorAll('.pokemon-card').forEach(card => {
      const isDisabled = disabledCards[card.id] === true;
      card.classList.toggle('disabled', isDisabled);
      card.setAttribute('draggable', !isDisabled);
    });
  }
  
  // 拖拽功能设置
  function setupDragAndDrop() {
    const cards = document.querySelectorAll('.pokemon-card');
    const redTeam = document.getElementById('redTeam');
    const blueTeam = document.getElementById('blueTeam');
  
    cards.forEach(card => {
      card.setAttribute('draggable', true);
      
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.id);
      });
    });
  
    [redTeam, blueTeam].forEach(team => {
      team.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
  
      team.addEventListener('drop', (e) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('text/plain');
        const card = document.getElementById(cardId);
        
        if (team.children.length < MAX_TEAM_SIZE && card.getAttribute('draggable') === 'true') {
          moveToTeam(card, team, true); // true表示需要更新Firebase
        }
      });
  
      team.addEventListener('click', (e) => {
        if (e.target.classList.contains('pokemon-card')) {
          moveToPool(e.target, true); // true表示需要更新Firebase
        }
      });
    });
  }
  
  // 移动到队伍
  function moveToTeam(card, team, updateFirebase) {
    // 隐藏属性标签
    const typeTags = card.querySelector('.type-tags');
    if (typeTags) {
      typeTags.style.display = 'none';
    }
    team.appendChild(card);
    
    if (updateFirebase && currentRoomId) {
      const teamName = team.id === 'redTeam' ? 'redTeam' : 'blueTeam';
      const updates = {};
      updates[`rooms/${currentRoomId}/${teamName}/${card.id}`] = true;
      database.ref().update(updates);
    }
  }
  
  // 移回卡池
  function moveToPool(card, updateFirebase) {
    // 显示属性标签
    const typeTags = card.querySelector('.type-tags');
    if (typeTags) {
      typeTags.style.display = 'block';
    }
    const pool = document.getElementById('cardPool');
    if (pool.firstChild) {
      pool.insertBefore(card, pool.firstChild);
    } else {
      pool.appendChild(card);
    }
    
    if (updateFirebase && currentRoomId) {
      const teamName = card.parentElement.id === 'redTeam' ? 'redTeam' : 'blueTeam';
      database.ref(`rooms/${currentRoomId}/${teamName}/${card.id}`).remove();
    }
  }
  
  // 加载宝可梦卡片
  async function loadPokemonCards(poolName = 'default') {
    try {
      const response = await fetch('pokemon_full_list.json');
      let data = await response.json();
  
      // 添加卡池过滤逻辑
      if (poolName !== 'default' && POKEMON_POOLS[poolName]) {
        data = data.filter(p => POKEMON_POOLS[poolName].has(p.name_en.toLowerCase()));
      }
      
      const container = document.getElementById('cardPool');
      container.innerHTML = '';
  
      data.forEach((pokemon, index) => {
        const card = document.createElement('div');
        card.className = 'pokemon-card';
        card.id = `pokemon-card-${index}`;
        
        const img = document.createElement('img');
        img.className = 'pokemon-img';
        img.src = `pokemon/${pokemon.name_en}.png`;
        img.alt = pokemon.name;
  
        // 添加右键事件监听器
        card.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          toggleDisableCard(card);
        });
  
        // 添加属性标签
        const typeTags = document.createElement('div');
        typeTags.className = 'type-tags';
        pokemon.types.forEach(type => {
            const tag = document.createElement('span');
            tag.textContent = type;
            tag.setAttribute('data-type', type);
            typeTags.appendChild(tag);
        });
    
        card.appendChild(img);
        card.appendChild(typeTags);
        container.appendChild(card);
      });
      
      // 设置卡池拖拽支持
      const cardPool = document.getElementById('cardPool');
      cardPool.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      
      cardPool.addEventListener('drop', (e) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('text/plain');
        const card = document.getElementById(cardId);
        if (card.getAttribute('draggable') === 'true') {
          moveToPool(card, true);
        }
      });
      
      setupDragAndDrop();
      setupSearch();
      
      // 清空队伍面板
      document.getElementById('redTeam').innerHTML = '';
      document.getElementById('blueTeam').innerHTML = '';
      
      // 如果已加入房间，同步禁用卡片状态
      if (currentRoomId) {
        database.ref(`rooms/${currentRoomId}/disabledCards`).once('value').then(snapshot => {
          const disabledCards = snapshot.val() || {};
          updateDisabledCards(disabledCards);
        });
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  }
  
  // 切换禁用卡片状态
  function toggleDisableCard(card) {
    const isDisabled = !card.classList.contains('disabled');
    card.classList.toggle('disabled', isDisabled);
    card.setAttribute('draggable', !isDisabled);
    
    // 更新到Firebase
    if (currentRoomId) {
      const updates = {};
      updates[`rooms/${currentRoomId}/disabledCards/${card.id}`] = isDisabled;
      database.ref().update(updates);
    }
  }
  
  // 搜索功能
  function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const cards = document.querySelectorAll('.pokemon-card');
  
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      
      cards.forEach(card => {
        const img = card.querySelector('.pokemon-img');
        const name = img.alt.toLowerCase();
        const nameEn = img.src.split('/').pop().replace('.png', '').toLowerCase();
        
        if (name.includes(searchTerm) || nameEn.includes(searchTerm)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
  
  // 卡池选择器
  document.getElementById('poolSelect').addEventListener('change', (e) => {
    const pool = e.target.value;
    loadPokemonCards(pool);
  });
  
  // 页面加载完成后执行
  window.onload = () => {
    loadPokemonCards();
  };
