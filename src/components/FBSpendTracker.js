import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Обновленный компонент, который принимает appId в качестве пропса
const FBSpendTracker = ({ appId }) => {
  // Состояния для хранения данных
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [spendData, setSpendData] = useState([]);
  const [totalSpend, setTotalSpend] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [allAccountsData, setAllAccountsData] = useState({});
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [hiddenAccounts, setHiddenAccounts] = useState([]);
  
  // Состояние для дат
  const [dateRange, setDateRange] = useState({
    since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 дней назад
    until: new Date().toISOString().split('T')[0] // сегодня
  });

  // Загрузка Facebook SDK при монтировании компонента или изменении appId
  useEffect(() => {
    const loadFacebookSDK = () => {
      // Очищаем предыдущие состояния при изменении App ID
      setIsSDKLoaded(false);
      setIsLoggedIn(false);
      setAccounts([]);
      setSpendData([]);
      setTotalSpend(0);
      setAllAccountsData({});
      setSelectedAccountId(null);
      setHiddenAccounts([]);
      
      // Удаляем предыдущий SDK, если он существует
      const existingScript = document.getElementById('facebook-jssdk');
      if (existingScript) {
        existingScript.remove();
      }
      
      // Инициализация Facebook SDK
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: appId, // Используем appId из пропсов
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });
        setIsSDKLoaded(true);
        
        // Проверяем статус логина
        window.FB.getLoginStatus(function(response) {
          if (response.status === 'connected') {
            setIsLoggedIn(true);
            loadAccounts();
          }
        });
      };

      // Загрузка SDK
      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    };

    loadFacebookSDK();
  }, [appId]); // Перезагружаем SDK при изменении appId

  // Функция для входа через Facebook
  const handleLogin = () => {
    if (!isSDKLoaded) return;

    window.FB.login(function(response) {
      if (response.authResponse) {
        console.log('Успешная авторизация');
        setIsLoggedIn(true);
        loadAccounts();
      } else {
        console.log('Ошибка авторизации');
      }
    }, {scope: 'ads_read,ads_management,public_profile'});
  };

  // Загрузка списка рекламных аккаунтов
  const loadAccounts = () => {
    window.FB.api('/me/adaccounts', {
      fields: 'name,account_id,account_status'
    }, function(response) {
      if (response && !response.error) {
        console.log('Получены аккаунты:', response.data);
        setAccounts(response.data);
        // Сбрасываем список скрытых аккаунтов при новой загрузке
        setHiddenAccounts([]);
      } else {
        console.error('Ошибка получения аккаунтов:', response.error);
      }
    });
  };
  
  // Функция для скрытия/показа аккаунта
  const toggleAccountVisibility = (accountId, event) => {
    // Останавливаем всплытие события, чтобы не срабатывал onClick родительской кнопки
    event.stopPropagation();
    
    setHiddenAccounts(prev => {
      if (prev.includes(accountId)) {
        // Если аккаунт уже скрыт, показываем его
        return prev.filter(id => id !== accountId);
      } else {
        // Иначе скрываем
        return [...prev, accountId];
      }
    });
  };
  
  // Экспорт данных в CSV
  const exportToCSV = () => {
    if (spendData.length === 0) return;
    
    // Формируем заголовки
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Дата,Расход ($)\n";
    
    // Добавляем данные
    spendData.forEach(row => {
      csvContent += `${row.date},${row.spend}\n`;
    });
    
    // Добавляем итого
    const totalSpendAmount = spendData.reduce((sum, day) => sum + day.spend, 0);
    csvContent += `Итого,${totalSpendAmount}\n`;
    
    // Создаем ссылку для скачивания
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fb_spend_${dateRange.since}_to_${dateRange.until}.csv`);
    document.body.appendChild(link);
    
    // Запускаем скачивание
    link.click();
    document.body.removeChild(link);
  };

  // Получение данных о расходах для одного аккаунта
  const fetchSpendData = async (accountId) => {
    console.log('Запрос данных для аккаунта:', accountId);
    setIsLoading(true);
    setSelectedAccountId(accountId);
    
    window.FB.api(
      `/${accountId}/insights`,
      'GET',
      {
        fields: 'spend',
        time_range: {
          'since': dateRange.since,
          'until': dateRange.until
        },
        time_increment: 1
      },
      function(response) {
        if (response && !response.error) {
          const formattedData = response.data.map(item => ({
            date: item.date_start,
            spend: parseFloat(item.spend || 0)
          }));
          console.log('Получены данные о расходах:', formattedData);
          
          // Сохраняем данные в общий объект
          setAllAccountsData(prev => ({
            ...prev,
            [accountId]: formattedData
          }));
          
          setSpendData(formattedData);
          setIsLoading(false);
        } else {
          console.error('Ошибка получения данных:', response.error);
          setIsLoading(false);
        }
      }
    );
  };
  
  // Получение данных о расходах для всех аккаунтов
  const fetchAllAccountsSpendData = async () => {
    setIsLoading(true);
    setTotalSpend(0);
    setAllAccountsData({});
    
    // Создаем временный объект для хранения данных по всем аккаунтам
    const tempData = {};
    let completedRequests = 0;
    
    // Для подсчета общего спенда
    let totalSpendAmount = 0;
    
    // Отфильтровываем скрытые аккаунты
    const visibleAccounts = accounts.filter(account => !hiddenAccounts.includes(account.id));
    
    // Если нет видимых аккаунтов
    if (visibleAccounts.length === 0) {
      setIsLoading(false);
      return;
    }
    
    // Функция для проверки завершения всех запросов
    const checkCompletion = () => {
      completedRequests++;
      if (completedRequests === visibleAccounts.length) {
        // Все запросы завершены
        // Объединяем данные по датам
        const combinedDataByDate = {};
        
        Object.values(tempData).forEach(accountData => {
          accountData.forEach(dayData => {
            if (!combinedDataByDate[dayData.date]) {
              combinedDataByDate[dayData.date] = { date: dayData.date, spend: 0 };
            }
            combinedDataByDate[dayData.date].spend += dayData.spend;
          });
        });
        
        // Преобразуем в массив и сортируем по дате
        const combinedData = Object.values(combinedDataByDate).sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );
        
        setAllAccountsData(tempData);
        setSpendData(combinedData);
        setTotalSpend(totalSpendAmount);
        setIsLoading(false);
        setSelectedAccountId(null);
      }
    };
    
    // Запрашиваем данные для каждого видимого аккаунта
    visibleAccounts.forEach(account => {
      window.FB.api(
        `/${account.id}/insights`,
        'GET',
        {
          fields: 'spend',
          time_range: {
            'since': dateRange.since,
            'until': dateRange.until
          },
          time_increment: 1
        },
        function(response) {
          if (response && !response.error && response.data) {
            const formattedData = response.data.map(item => ({
              date: item.date_start,
              spend: parseFloat(item.spend || 0)
            }));
            
            // Добавляем данные аккаунта в временный объект
            tempData[account.id] = formattedData;
            
            // Считаем общий спенд
            const accountTotal = formattedData.reduce(
              (sum, day) => sum + day.spend, 0
            );
            totalSpendAmount += accountTotal;
          }
          checkCompletion();
        }
      );
    });
  };

  return (
    <div className="p-4">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Facebook Spend Tracker</h1>

        {/* Кнопка входа */}
        {!isLoggedIn ? (
          <button
            onClick={handleLogin}
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={!isSDKLoaded}
          >
            Подключить Facebook
          </button>
        ) : (
          <div className="space-y-6">
            {/* Выбор дат */}
            <div className="flex gap-4 items-center">
              <input
                type="date"
                value={dateRange.since}
                onChange={(e) => setDateRange(prev => ({ ...prev, since: e.target.value }))}
                className="border rounded px-3 py-2"
              />
              <span>по</span>
              <input
                type="date"
                value={dateRange.until}
                onChange={(e) => setDateRange(prev => ({ ...prev, until: e.target.value }))}
                className="border rounded px-3 py-2"
              />
              <button
                onClick={fetchAllAccountsSpendData}
                disabled={isLoading}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {isLoading ? 'Загрузка...' : 'Получить данные по всем аккаунтам'}
              </button>
            </div>
            
            {/* Отображение общего спенда */}
            {totalSpend > 0 && !selectedAccountId && (
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="text-lg font-semibold">Общий спенд за период:</h3>
                <p className="text-3xl font-bold">${totalSpend.toFixed(2)}</p>
              </div>
            )}

            {/* Список аккаунтов */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Рекламные аккаунты:</h2>
                {hiddenAccounts.length > 0 && (
                  <div className="text-sm text-gray-500">
                    Исключено аккаунтов: {hiddenAccounts.length}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {accounts.map(account => (
                  <button
                    key={account.id}
                    onClick={() => fetchSpendData(account.id)}
                    className={`p-3 rounded text-left hover:bg-gray-200 ${
                      selectedAccountId === account.id ? 'bg-blue-100 border-blue-400 border' : 
                      hiddenAccounts.includes(account.id) ? 'bg-gray-300 opacity-60' : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        {account.name || account.id}
                        {allAccountsData[account.id] && (
                          <div className="mt-2 text-sm">
                            Спенд: $
                            {allAccountsData[account.id]
                              .reduce((sum, day) => sum + day.spend, 0)
                              .toFixed(2)}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={(e) => toggleAccountVisibility(account.id, e)}
                        className={`ml-2 px-2 py-1 rounded text-xs ${
                          hiddenAccounts.includes(account.id) 
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-200 hover:bg-red-200'
                        }`}
                      >
                        {hiddenAccounts.includes(account.id) ? 'Включить' : 'Исключить'}
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* График и таблица */}
            {spendData.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-4">
                  {selectedAccountId 
                    ? `Расходы по дням (аккаунт ${selectedAccountId})` 
                    : 'Общие расходы по дням:'}
                </h2>
                
                <LineChart
                  width={800}
                  height={300}
                  data={spendData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="spend" 
                    stroke="#3b82f6" 
                    name="Расход ($)" 
                  />
                </LineChart>
                
                {/* Таблица с данными */}
                <div className="mt-6">
                  <div className="flex justify-between mb-2">
                    <h3 className="text-lg font-semibold">Данные по дням:</h3>
                    <button 
                      onClick={exportToCSV}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Экспорт в CSV
                    </button>
                  </div>
                  
                  <div className="overflow-auto max-h-96">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border px-4 py-2 text-left">Дата</th>
                          <th className="border px-4 py-2 text-right">Расход ($)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {spendData.map((day, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="border px-4 py-2">{day.date}</td>
                            <td className="border px-4 py-2 text-right">${day.spend.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100 font-bold">
                          <td className="border px-4 py-2">Итого:</td>
                          <td className="border px-4 py-2 text-right">
                            ${spendData.reduce((sum, day) => sum + day.spend, 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FBSpendTracker;