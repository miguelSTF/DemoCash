
function generateArray(table,columnsToIgnore, rowsToIgnore) {
   var arrRowsToIgnore = strIgnore(rowsToIgnore);
   var arrColumnsToIgnore = strIgnore(columnsToIgnore);
    var out = [];
    var rows = table.querySelectorAll('tr');
    var ranges = [];
    var columnasNumericas;
    for (var R = 0; R < rows.length; R++) {
      var ignoreRow = ignoreColumnOrRow(R,arrRowsToIgnore);
      if(ignoreRow === true){ continue; }
        var outRow = [];
        var row = rows[R];
        var columns = R === 0 ?  row.querySelectorAll('th') : row.querySelectorAll('td');
        columnasNumericas = numericColumns(columns);
        for (var C = 0; C < columns.length; C++) {
           var ignoreCol = ignoreColumnOrRow(C,arrColumnsToIgnore);
           if(ignoreCol === true){continue; }
            var cell = columns[C];
            var isNumeric = false;

            columnasNumericas.forEach(function(columnnNumber,index){
              if(columnasNumericas[index] === C ){
                isNumeric = true;
              }
            });

            var colspan = 1;
            var rowspan = 1;
            var cellValue = '';
            if(R === 0 ){
               colspan = 1;
               rowspan = 1;
               cellValue = getCellText(cell,isNumeric);
            }
            else{
               colspan = cell.getAttribute('colspan');
               rowspan = cell.getAttribute('rowspan');
               cellValue = getCellText(cell,isNumeric);
            }
            //if(ignoreCol === true){cellValue ="";}
            if(cellValue !== '' && cellValue === +cellValue)
            {
              cellValue = +cellValue;
            }

            //Skip ranges
            ranges.forEach(function(range) {
                if(R >= range.s.r && R <= range.e.r && outRow.length >= range.s.c && outRow.length <= range.e.c) {
                    for(var i = 0; i <= range.e.c - range.s.c; ++i)
                    {
                      outRow.push(null);
                    }
                }
            });

            //Handle Row Span
            if (rowspan || colspan) {
                rowspan = rowspan || 1;
                colspan = colspan || 1;
                ranges.push({s:{r:R, c:outRow.length},e:{r:R+rowspan-1, c:outRow.length+colspan-1}});
            }
            //Handle Value
            outRow.push(cellValue !== '' ? cellValue : null);

            //Handle Colspan
            if (colspan) {
              for (var k = 0; k < colspan - 1; ++k) {
                outRow.push(null);
              }
            }
        }
          out.push(outRow);
    }
    return [out, ranges, columnasNumericas];
}

function getCellText(cell, isNumeric){ //columnContent = cell
   var size = cell.childElementCount;
   if(size > 1){
     var childs =cell.children;
     if(childs !== undefined){
      for(var i = 0; i < childs.length; i++){
         var span = childs[i];
          if(span.tagName === 'SPAN' && span.innerText === 'Si' || span.innerText === 'No'){
            return formatNumberColumn(span.innerText,isNumeric);
         }
       }
     }
   }
   else{
      return formatNumberColumn(cell.innerText,isNumeric);
   }
}

function datenum(v, date1904) {
	if(date1904) {v+=1462;}
	var epoch = Date.parse(v);
	return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

function sheetFromArrayOfArrays(data, numericColumnas, recalcular) {
  var columnasNumericas = numericColumnas !== null && numericColumnas !== undefined ? numericColumnas : null;
	var ws = {};
	var range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }};
	for(var R = 0; R !== data.length; ++R) {
		for(var C = 0; C !== data[R].length; ++C) {
			if(range.s.r > R){ range.s.r = R;}
			if(range.s.c > C){ range.s.c = C;}
			if(range.e.r < R){ range.e.r = R;}
			if(range.e.c < C){ range.e.c = C;}
			var cell = {v: data[R][C] };
			if(cell.v === null) { continue;}
			var cellRef = XLSX.utils.encode_cell({c:C,r:R});
      /*
			if(typeof cell.v === 'number') { cell.t = 'n';}
			else if(typeof cell.v === 'boolean'){ cell.t = 'b';}
			else if(cell.v instanceof Date) {
				cell.t = 'n'; cell.z = XLSX.SSF._table[14];
				cell.v = datenum(cell.v);
			}
			else  {cell.t = 's';} */
      if(R > 0){
        var isNumeric = columnIsNumeric(C, columnasNumericas,recalcular);
        if(isNumeric){
           cell.t = 'n';
        }
        else{
          cell.t = 's';
        };
      }

			ws[cellRef] = cell;
		}
	}
	if(range.s.c < 10000000) {ws['!ref'] = XLSX.utils.encode_range(range);}
	return ws;
}

function Workbook() {
	if(!(this instanceof Workbook)) return new Workbook();
	this.SheetNames = [];
	this.Sheets = {};
}

function s2ab(s) {
	var buf = new ArrayBuffer(s.length);
	var view = new Uint8Array(buf);
	for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
	return buf;
}

function getIfRecalcaular(table,columnsToIgnore, rowsToIgnore){
   var respuesta= false;
   var arrColumnsToIgnore = JSON.parse(columnsToIgnore);
   var index = arrColumnsToIgnore.indexOf(0);
   if(index >= 0){
    respuesta = true;
   }
   return respuesta;
}

function export_table_to_excel(id,tblName,rowsToIgnore,columnsToIgnore) {
var tableName = tblName;
var rowsIgnore = rowsToIgnore;
var theTable = document.getElementById(id);
var oo = generateArray(theTable,columnsToIgnore,rowsToIgnore);
var recalcular = getIfRecalcaular(theTable,columnsToIgnore,rowsToIgnore);
var ranges = oo[1];

/* original data */
var data = oo[0];
var numericColumnas = oo[2];
var ws_name = "SheetJS";
console.log(data);

var wb = new Workbook(), ws = sheetFromArrayOfArrays(data,numericColumnas,recalcular);

/* add ranges to worksheet */
ws['!merges'] = ranges;

/* add worksheet to workbook */
wb.SheetNames.push(ws_name);
wb.Sheets[ws_name] = ws;

var wbout = XLSX.write(wb, {bookType:'xlsx', bookSST:false, type: 'binary'});

saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), tableName +".xlsx")
}

function strIgnore(columnsToIgnore){
  if(columnsToIgnore !== undefined && columnsToIgnore !== null){
    columnsToIgnore = columnsToIgnore.replace('[', '');
    columnsToIgnore = columnsToIgnore.replace(']','');
    var array = columnsToIgnore.split(",");
    return array;
  }
    var arrayDefault = [-1];
    return arrayDefault;
}

function ignoreColumnOrRow(index,columnsToIgnore){
  var ignore = false;
  columnsToIgnore.forEach(function(column){
    if(index == column){
      ignore = true;
    }
  });
  return ignore;
}
function formatNumberColumn(data, isNumeric){
  var str = data.toString();
  if(str != null && str != undefined && isNumeric){
    str = str.replace(new RegExp(',', 'g'), '');
    return Number(str);
  }
  return data;
}

function numericColumns(nodeList) {
  var array = [];
  for(var i = 0; i < nodeList.length; i++){
    var n = nodeList.item(i).className.search('isNumberExcel');
    if( n > -1){
      array.push(i);
    }
  }
  return array;
}

function columnIsNumeric(column, columnasNumericas,recalcular){
  var respuesta = false;
  if(columnasNumericas !== undefined){
    if (recalcular) {
      columnasNumericas.forEach(function(item){
        if((item-1) === column){
          respuesta = true;
        }
      });
    }else {
      columnasNumericas.forEach(function(item){
        if(item === column){
          respuesta = true;
        }
      });
    }
  }
  return respuesta;
}
