/**
 * `FileSaver` save data to file as downloading
 */
export default class FileSaver {
    /**
     * Save data to text file
     * @param {String} data - data for save
     * @param {String} fileName - name of file to save
     * @param {String} contentType - name of file to save
     */
    static saveTextToFile(data, fileName, contentType = 'data:text/plain;charset=utf-8,') {
        let a = document.createElement('a');
        a.download = fileName;
        a.href = contentType + data;
        FileSaver._click(a);
    }

    static _click(node) {
        try {
            node.dispatchEvent(new MouseEvent('click'));
        } catch (e) {
            let evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('click', true, true, window, 0, 0, 0, 80,
                20, false, false, false, false, 0, null);
            node.dispatchEvent(evt);
        }
    }
}