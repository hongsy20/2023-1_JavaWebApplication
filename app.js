const mysql = require('mysql');
const express = require('express');
const fs = require('fs');
const multer = require('multer');
const readline = require('readline');
const { type } = require('os');
const engines = require('consolidate');
const app = express();

// MySQL 데이터베이스 연결 설정
const connection = mysql.createConnection({
  host: '호스트 이름',
  user: '사용자명',
  password: '비밀번호',
  database: '데이터베이스명'
});

// MySQL 연결
connection.connect((err) => {
  if (err) {
    console.error('MySQL 연결 오류:', err);
    throw err;
  }
  console.log('MySQL에 연결되었습니다.');
});

const storage = multer.diskStorage({ 
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage})

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/uploadfile.html');
});

app.engine('html', engines.mustache);
app.set('view engine', 'html');

let table_number = 0

app.post('/upload', upload.single('Uploadfile'), (req, res) => {
  console.log('파일 읽기');
  const uploadFile = req.file;
  const filename = uploadFile.originalname;
  let instream = fs.createReadStream(filename);
  let reader = readline.createInterface(instream, null);

  reader.on('line', (line) => {
    if(line.startsWith('\ttask1\ttask2\ttask3\ttask4\ttask5')) {
      table_number++;
      return;
    }
    const data = line.split('\t');
    let coreNumber = data[0];
    const values = data.slice(1);

    if (coreNumber === 'core1') coreNumber = 1;
    else if (coreNumber === 'core2') coreNumber = 2;
    else if (coreNumber === 'core3') coreNumber = 3;
    else if (coreNumber === 'core4') coreNumber = 4;
    else if (coreNumber === 'core5') coreNumber = 5;

    for(let i = 1; i < values.length; i++) {
      const value = parseInt(values[i - 1]);
      if(isNaN(value)) {
        console.log('유효하지 않은 값');
      }

      const query = 'INSERT INTO t_score VALUES (?, ?, ?, ?)';
      connection.query(query, [table_number, coreNumber, i, value], (err, result) => {
        if(err) {
          console.error('MySQL 삽입 실패 : ', err);
          return;
        }
      })
    }
    });

    reader.on('close', () => {
      console.log('파일 읽기 성공');
      
      var sql = `
      SELECT MAX(valueNumber) AS maxnum, MIN(valueNumber) AS minnum, AVG(valueNumber) AS avgnum, STD(valueNumber) AS stdnum FROM t_score WHERE taskNumber=1 GROUP BY coreNumber
      UNION ALL
      SELECT MAX(valueNumber) AS maxnum, MIN(valueNumber) AS minnum, AVG(valueNumber) AS avgnum, STD(valueNumber) AS stdnum FROM t_score WHERE taskNumber=2 GROUP BY coreNumber
      UNION ALL
      SELECT MAX(valueNumber) AS maxnum, MIN(valueNumber) AS minnum, AVG(valueNumber) AS avgnum, STD(valueNumber) AS stdnum FROM t_score WHERE taskNumber=3 GROUP BY coreNumber
      UNION ALL
      SELECT MAX(valueNumber) AS maxnum, MIN(valueNumber) AS minnum, AVG(valueNumber) AS avgnum, STD(valueNumber) AS stdnum FROM t_score WHERE taskNumber=4 GROUP BY coreNumber
      UNION ALL
      SELECT MAX(valueNumber) AS maxnum, MIN(valueNumber) AS minnum, AVG(valueNumber) AS avgnum, STD(valueNumber) AS stdnum FROM t_score WHERE taskNumber=5 GROUP BY coreNumber
      UNION ALL
      SELECT MAX(valueNumber) AS maxnum, MIN(valueNumber) AS minnum, AVG(valueNumber) AS avgnum, STD(valueNumber) AS stdnum FROM t_score WHERE coreNumber=1 GROUP BY taskNumber
      UNION ALL
      SELECT MAX(valueNumber) AS maxnum, MIN(valueNumber) AS minnum, AVG(valueNumber) AS avgnum, STD(valueNumber) AS stdnum FROM t_score WHERE coreNumber=2 GROUP BY taskNumber
      UNION ALL
      SELECT MAX(valueNumber) AS maxnum, MIN(valueNumber) AS minnum, AVG(valueNumber) AS avgnum, STD(valueNumber) AS stdnum FROM t_score WHERE coreNumber=3 GROUP BY taskNumber
      UNION ALL
      SELECT MAX(valueNumber) AS maxnum, MIN(valueNumber) AS minnum, AVG(valueNumber) AS avgnum, STD(valueNumber) AS stdnum FROM t_score WHERE coreNumber=4 GROUP BY taskNumber
      UNION ALL
      SELECT MAX(valueNumber) AS maxnum, MIN(valueNumber) AS minnum, AVG(valueNumber) AS avgnum, STD(valueNumber) AS stdnum FROM t_score WHERE coreNumber=5 GROUP BY taskNumber`;

      connection.query(sql, (err, results) => {
        if (err) {
          console.error('MySQL 쿼리 오류:', err);
          return;
        }
        console.log(results);
        console.log(results.length);
        const maxNumber = []
        const minNumber = []
        const avgNumber = []
        const stdNumber = []

        for(let i = 0; i < results.length; i++) {
          maxNumber.push(results[i].maxnum);
          minNumber.push(results[i].minnum);
          avgNumber.push(results[i].avgnum);
          stdNumber.push(results[i].stdnum);
        }

        res.render('show_graph.html', { maxNumber: JSON.stringify(maxNumber), minNumber: JSON.stringify(minNumber), avgNumber: JSON.stringify(avgNumber), stdNumber: JSON.stringify(stdNumber) });
      });
    });
});

app.listen(8080, () => {
  console.log('서버가 8080에서 실행 중');
});