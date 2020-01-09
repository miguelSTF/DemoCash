/*The MIT License (MIT)

Copyright (c) 2014 https://github.com/kayalshri/

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.*/
(function($){
        $.fn.extend({
            tableExport: function(options) {
            var defaults = {
                        separator: ',',
                        ignoreColumn: ignoreColumn,
                        tableName:'table',
                        type:'csv',
                        pdfFontSize:12,
                        pdfLeftMargin:20,
                        escape:'true',
                        htmlContent:'false',
                        consoleLog:'false',
              deleteLastColumn:'true'
                };
                var options = $.extend(defaults, options);
                var el = this;
                if( (defaults.type === 'csv' || defaults.type === 'txt') ){
                    // Header
                    var tdData ="";
          var length = $(el).find('thead').find('th').length;
                    $(el).find('thead').find('tr').each(function() {
                    //tdData += "\n";
           var columnData ={};
                        $(this).filter(':visible').find('th').each(function(index,data) {
             columnData = ignoreColumn(index,length,defaults.ignoreColumn);
                            if ( ($(this).css('display') != 'none') && (columnData.ignore == false && columnData.isLastElement == false)){
                    if(index != length-1){
                      var str = parseString($(this));
                      tdData +=  str.replace(/\n/g,"-") + defaults.separator;
                    }
                    else if(index == length-1){
                      tdData = $.trim(tdData);
                      tdData = $.trim(tdData).substring(0, tdData.length -1);
                    }
                            }
              else if( ($(this).css('display') != 'none') && (columnData.ignore == false && columnData.isLastElement == true) ){
                var str = parseString($(this));
                tdData +=  str.replace(/\n/g,"-") + defaults.separator;
                tdData = $.trim(tdData);
                tdData = $.trim(tdData).substring(0, tdData.length -1);
              }
              else if( ($(this).css('display') != 'none') && (columnData.ignore == true && columnData.isLastElement == true) ){
                tdData = $.trim(tdData);
                tdData = $.trim(tdData).substring(0, tdData.length -1);
              }
                        });
                    });
                    // Row vs Column
                    $(el).find('tbody').find('tr').each(function() {
                    tdData += "\n";
          var columnData ={};
                        $(this).filter(':visible').find('td').each(function(index,data) {
              columnData = ignoreColumn(index,length,defaults.ignoreColumn);
              if ( ($(this).css('display') != 'none') && (columnData.ignore == false && columnData.isLastElement == false)){
                    if(index != length-1){
                      var str = parseString($(this));
                      str = str.replace(new RegExp(',', 'g'), '');
                      tdData +=  str.replace(/\n/g,"-") + defaults.separator;
                    }
                    else if(index == length-1){
                      tdData = $.trim(tdData);
                      tdData = $.trim(tdData).substring(0, tdData.length -1);
                    }
              }
              else if( ($(this).css('display') != 'none') && (columnData.ignore == false && columnData.isLastElement == true) ){
                var str = parseString($(this));
                tdData +=  str.replace(/\n/g,"-") + defaults.separator;
                tdData = $.trim(tdData);
                tdData = $.trim(tdData).substring(0, tdData.length -1);
              }
              else if( ($(this).css('display') != 'none') && (columnData.ignore == true && columnData.isLastElement == true) ){
                tdData = $.trim(tdData);
                tdData = $.trim(tdData).substring(0, tdData.length -1);
              }
                        });
                    });
                    //output
                    if(defaults.consoleLog == 'true'){
                        console.log(tdData);
                    }

                //Exportacion CSV para  IE y Edge
                try{
                  if( defaults.type === 'csv'){

                    tdData = tdData.replace(/[\u200e]/g,'');
                    var BOM = '\uFEFF'; 
                    var blob  = new Blob([BOM + tdData], { type: 'text/csv;charset=utf-8' });
                    window.navigator.msSaveOrOpenBlob(blob, defaults.tableName.toString() + '.csv');
                  }
                  else if(defaults.type === 'txt')
                  {
                      var BOM = '\uFEFF'; 
                      var blob  = new Blob([BOM + tdData], { type: 'text/csv;charset=utf-8' });
                      window.navigator.msSaveOrOpenBlob(blob, defaults.tableName.toString() + '.txt');
                  }
                }
                catch(err){
                  console.log("Exportando para navegador distinto a Edge o IE");

                  //Exportacion mozilla y chrome
                  var base64data = "base64," + $.base64.encode(tdData);
                  var doc = document.createElement("a");

                  doc.setAttribute("target", "_blank");
                  doc.setAttribute("download", defaults.tableName.toString()+'.'+defaults.type.toString());
                  doc.setAttribute("href", 'data:application/'+defaults.type.toString()+';filename=exportData;'+base64data.toString());
                  document.body.appendChild(doc);
                  doc.click();
                }
        }

        function ignoreColumn(index,lengthTableColumns,ignoreArray){
          var columnData = {
            'ignore':false,
            'isLastElement':false
          }
          if(ignoreArray == null || undefined){
            return columnData;
          }
          var length = lengthTableColumns;
          ignoreArray.forEach(function(column){
            if(index == column){
              columnData.ignore = true;
            }
            if(index == length -1){
              columnData.isLastElement = true;
            }
          });
          return columnData;
        }
                function parseString(data){
                    if(defaults.htmlContent == 'true'){
                        content_data = data.html().trim();
                    }else{
                        content_data = data.text().trim();
                    }
                    if(defaults.escape == 'true'){
                        content_data = escape(content_data);
                    }
                    return content_data;
                }
            }
        });
    })(jQuery);
