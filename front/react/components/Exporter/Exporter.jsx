import React from 'react';
import FileSaver from '../../utils/file-saver.js'
import Dxf from '../../utils/libDXF/dxf.js'
import DxfConverter from '../../utils/libDXF/dxf-converter.js'

import './Exporter.scss'


export default class Exporter extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            fileName: 'file',
            saved: false,

            neutralLayerName: 'neutral',
            neutralColor: 2,
            neutralLineType: 2,

            profileLayerName: 'profile',
            profileColor: 1,
            profileLineType: 1,

            rollerLayerName: 'roller',
            rollerColor: 5,
            rollerLineType: 1,
            
            rollerAxisLayerName: 'roller-axis',
            rollerAxisColor: 8,
            rollerAxisLineType: 2,
        };

        this.saveToDxf = this.saveToDxf.bind(this);
        this.changeFileName = this.changeFileName.bind(this);

        this.changeNeutralColor = this.changeNeutralColor.bind(this);
        this.changeNeutralLine = this.changeNeutralLine.bind(this);
        this.changeNeutralLayerName = this.changeNeutralLayerName.bind(this);

        this.changeProfileColor = this.changeProfileColor.bind(this);
        this.changeProfileLine = this.changeProfileLine.bind(this);
        this.changeProfileLayerName = this.changeProfileLayerName.bind(this);

        this.changeRollerColor = this.changeRollerColor.bind(this);
        this.changeRollerLine = this.changeRollerLine.bind(this);
        this.changeRollerLayerName = this.changeRollerLayerName.bind(this);
                
        this.changeRollerAxisColor = this.changeRollerAxisColor.bind(this);
        this.changeRollerAxisLine = this.changeRollerAxisLine.bind(this);
        this.changeRollerAxisLayerName = this.changeRollerAxisLayerName.bind(this);

        this.getNewFileName = this.getNewFileName.bind(this);
    }

    getNewFileName() {
        const nowDate = new Date();
        let newName = 'export_' + nowDate.getFullYear() + (nowDate.getMonth() + 1) + nowDate.getDate() 
            + '-' + nowDate.getHours() + nowDate.getMinutes() + nowDate.getSeconds();
        return newName;
    }

    componentDidMount() {
        const nowDate = new Date();
        this.setState({fileName: this.getNewFileName()})
    }

    saveToDxf() {
        const {fileName} = this.state;
        const fullFileName = `${fileName}.dxf`
        const exchangeData = this.getSections();

        exchangeData.colors = {
            neutral: this.state.neutralColor,
            profile: this.state.profileColor,
            roller: this.state.rollerColor,
            rollerAxis: this.state.rollerAxisColor,
        }
        exchangeData.lineTypes = {
            neutral: this.state.neutralLineType,
            profile: this.state.profileLineType,
            roller: this.state.rollerLineType,
            rollerAxis: this.state.rollerAxisLineType,
        }
        exchangeData.layerNames = {
            neutral: this.state.neutralLayerName,
            profile: this.state.profileLayerName,
            roller: this.state.rollerLayerName,
            rollerAxis: this.state.rollerAxisLayerName,
        }

        const converter = new DxfConverter();
        const dxfFile = new Dxf();
        converter.writeSectionsToDxf(exchangeData, dxfFile);
        FileSaver.saveTextToFile(dxfFile.body, fullFileName);

        this.setState({saved: true});
    }

    changeFileName(e) {
        this.setState({
            fileName: `${e.target.value || 'file'}`,
        })
    }

    changeNeutralColor(e) {
        this.setState({
            neutralColor: Number(e.target.value) || 7,
        })
    }
    changeNeutralLine(e) {
        this.setState({
            neutralLineType: Number(e.target.value) || 1,
        })
    }
    changeNeutralLayerName(e) {
        this.setState({
            neutralLayerName: e.target.value,
        })
    }

    changeProfileColor(e) {
        this.setState({
            profileColor: Number(e.target.value) || 7,
        })
    }
    changeProfileLine(e) {
        this.setState({
            profileLineType: Number(e.target.value) || 1,
        })
    }
    changeProfileLayerName(e) {
        this.setState({
            profileLayerName: e.target.value,
        })
    }

    changeRollerColor(e) {
        this.setState({
            rollerColor: Number(e.target.value) || 7,
        })
    }
    changeRollerLine(e) {
        this.setState({
            rollerLineType: Number(e.target.value) || 1,
        })
    }
    changeRollerLayerName(e) {
        this.setState({
            rollerLayerName: e.target.value,
        })
    }

    changeRollerAxisColor(e) {
        this.setState({
            rollerAxisColor: Number(e.target.value) || 7,
        })
    }
    changeRollerAxisLine(e) {
        this.setState({
            rollerAxisLineType: Number(e.target.value) || 1,
        })
    }
    changeRollerAxisLayerName(e) {
        this.setState({
            rollerAxisLayerName: e.target.value,
        })
    }

    render() {
        const {dataIn} = this.props;
        const {fileName} = this.state;
        let data = this.getSections();

        const colors = [
            {value: 7, name: 'Черный / белый', rgb: '#fff'},
            {value: 1, name: 'Красный', rgb: '#f00'},
            {value: 2, name: 'Желтый', rgb: '#ff0'},
            {value: 3, name: 'Зеленый', rgb: '#0f0'},
            {value: 4, name: 'Голубой', rgb: '#0ff'},
            {value: 5, name: 'Синий', rgb: '#00f'},
            {value: 6, name: 'Фиолетовый', rgb: '#f0f'},
            {value: 8, name: 'Серый (темный)', rgb: '#808080'},
            {value: 9, name: 'Серый (светлый)', rgb: '#c0c0c0'},
        ];

        const lineTypes = [
            {value: 1, type: 'Сплошная ( ⸺⸺⸺ )'},
            {value: 2, type: 'Штрихпунктирная ( ⸺ - ⸺ - ⸺ )'}
        ]

        return(
            <div className='exporter'>
                <div className='exporter__header'>
                    <h2>
                        Экспорт геометрии
                    </h2>
                </div>

                <hr/>
                <div className='exporter__layers-style'>
                    <h3>
                        Стилизация слоев:
                    </h3>
                    <table>
                        <tbody>
                            <tr>
                                <td></td>
                                <td>Название слоя</td>
                                <td>Цвет линий</td>
                                <td>Тип линий</td>
                            </tr>

                            <tr>
                                <td>Нейтраль</td>
                                <td>
                                    <input
                                        onChange={this.changeNeutralLayerName}
                                        value={this.state.neutralLayerName}
                                    />
                                </td>
                                <td>
                                    <select value={this.state.neutralColor} onChange={this.changeNeutralColor}>
                                        <option disabled>Выберите цвет:</option>
                                        {colors.map((color) => (
                                            <option 
                                                value={color.value}
                                                key={`color-${color.value}`}
                                                style={{background: color.rgb}}
                                            >
                                                {color.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <select value={this.state.neutralLineType} onChange={this.changeNeutralLine}>
                                        <option disabled>Выберите тип линии:</option>
                                        {lineTypes.map((lineType) => (
                                            <option value={lineType.value} key={`lineType-${lineType.value}`}>{lineType.type}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>

                            <tr>
                                <td>Профиль (эквидистанты)</td>
                                <td>
                                    <input
                                        onChange={this.changeProfileLayerName}
                                        value={this.state.profileLayerName}
                                    />
                                </td>
                                <td>
                                    <select value={this.state.profileColor} onChange={this.changeProfileColor}>
                                    <option disabled>Выберите цвет:</option>
                                        {colors.map((color) => (
                                            <option 
                                                value={color.value}
                                                key={`color-${color.value}`}
                                                style={{background: color.rgb}}
                                            >
                                                {color.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <select value={this.state.profileLineType} onChange={this.changeProfileLine}>
                                        <option disabled>Выберите тип линии:</option>
                                        {lineTypes.map((lineType) => (
                                            <option value={lineType.value} key={`lineType-${lineType.value}`}>{lineType.type}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>

                            <tr>
                                <td>Валки</td>
                                <td>
                                    <input
                                        onChange={this.changeRollerLayerName}
                                        value={this.state.rollerLayerName}
                                    />
                                </td>
                                <td>
                                    <select value={this.state.rollerColor} onChange={this.changeRollerColor}>
                                    <option disabled>Выберите цвет:</option>
                                        {colors.map((color) => (
                                            <option 
                                                value={color.value}
                                                key={`color-${color.value}`}
                                                style={{background: color.rgb}}
                                            >
                                                {color.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <select value={this.state.rollerLineType} onChange={this.changeRollerLine}>
                                        <option disabled>Выберите тип линии:</option>
                                        {lineTypes.map((lineType) => (
                                            <option value={lineType.value} key={`lineType-${lineType.value}`}>{lineType.type}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>

                            <tr>
                                <td>Оси валков</td>
                                <td>
                                    <input
                                        onChange={this.changeRollerAxisLayerName}
                                        value={this.state.rollerAxisLayerName}
                                    />
                                </td>
                                <td>
                                    <select value={this.state.rollerAxisColor} onChange={this.changeRollerAxisColor}>
                                        <option disabled>Выберите цвет:</option>
                                        {colors.map((color) => (
                                            <option 
                                                value={color.value}
                                                key={`color-${color.value}`}
                                                style={{background: color.rgb}}
                                            >
                                                {color.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <select value={this.state.rollerAxisLineType} onChange={this.changeRollerAxisLine}>
                                    <option disabled>Выберите тип линии:</option>
                                        {lineTypes.map((lineType) => (
                                            <option value={lineType.value} key={`lineType-${lineType.value}`}>{lineType.type}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <hr/>
                <div className='exporter__input-name'>
                    <h3>
                        Название файла:
                    </h3>
                    <input
                        onChange={this.changeFileName}
                        placeholder={fileName}
                        size='30'
                    />
                </div>

                <hr/>

                <div className='exporter__button-save'>
                    <h3>
                        Сохранение:
                    </h3>
                    <button
                        onClick={this.saveToDxf}

                    >
                        Сохранить в DXF
                    </button>
                </div>
                {(this.state.saved) && (
                    <div className='exporter__saved'>
                        Экспорт прошел успешно. Файл сохранен на компьютере.
                    </div>
                )}
            </div>
        )
    }
    
    // временное решение
    getSections(){
        const roller1 = {
            primitives: [
                {
                    id: '123',
                    type: 'LINE',
                    x1: -85.1147,
                    y1: 76.1218,
                    z1: 0,
                    x2: -50.114,
                    y2: 15.5,
                    z2: 0,
                },
                {
                    id: '124',
                    type: 'ARC',
                    x: -25,
                    y: 30,
                    z: 0,
                    R: 29,
                    fi_start: 210,
                    fi_end: 270,
                },
                {
                    id: '123',
                    type: 'LINE',
                    x1: -25,
                    y1: 1,
                    z1: 0,
                    x2: 25,
                    y2: 1,
                    z2: 0,
                },
                {
                    id: '124',
                    type: 'ARC',
                    x: 25,
                    y: 30,
                    z: 0,
                    R: 29,
                    fi_start: 270,
                    fi_end: 330,
                },
                {
                    id: '123',
                    type: 'LINE',
                    x1: 50.1147,
                    y1: 15.5,
                    z1: 0,
                    x2: 85.1147,
                    y2: 76.1218,
                    z2: 0,
                },
                {
                    id: '123',
                    type: 'LINE',
                    x1: 85.1147,
                    y1: 76.1218,
                    z1: 0,
                    x2: 85.1147,
                    y2: 121,
                    z2: 0,
                },
                {
                    id: '123',
                    type: 'LINE',
                    x1: -85.1147,
                    y1: 76.1218,
                    z1: 0,
                    x2: -85.1147,
                    y2: 121,
                    z2: 0,
                },
                // {
                //     id: '124',
                //     type: 'ARC',
                //     x: 0,
                //     y: 0,
                //     z: 0,
                //     R: 50,
                //     fi_start: 90,
                //     fi_end: 210,
                // }
                {
                    id: 'axis1',
                    type: 'LINE',
                    x1: 85.1147,
                    y1: 121,
                    z1: 0,
                    x2: -85.1147,
                    y2: 121,
                    z2: 0,
                },
            ],
            axisId: 'axis1'
        };
        // const axis1 = {
        //     primitives: [
        
        //     ]
        // };
        const roller2 = {
            primitives: [
                {
                    id: '125',
                    type: 'LINE',
                    x1: -86.8468,
                    y1: 75.1218,
                    z1: 0,
                    x2: -42.8979,
                    y2: -1,
                    z2: 0,
                },
                {
                    id: '123',
                    type: 'LINE',
                    x1: -42.8979,
                    y1: -1,
                    z1: 0,
                    x2: 42.8979,
                    y2: -1,
                    z2: 0,
                },
                {
                    id: '123',
                    type: 'LINE',
                    x1: 42.8979,
                    y1: -1,
                    z1: 0,
                    x2: 86.8468,
                    y2: 75.1218,
                    z2: 0,
                },
                {
                    id: '123',
                    type: 'LINE',
                    x1: 86.8468,
                    y1: 75.1218,
                    z1: 0,
                    x2: 115.8555,
                    y2: 75.1218,
                    z2: 0,
                },
                {
                    id: '123',
                    type: 'LINE',
                    x1: 115.8555,
                    y1: 75.1218,
                    z1: 0,
                    x2: 115.8555,
                    y2: -51,
                    z2: 0,
                },
                {
                    id: '123',
                    type: 'LINE',
                    x1: -115.9406,
                    y1: -51,
                    z1: 0,
                    x2: -115.9406,
                    y2: 75.1218,
                    z2: 0,
                },
                {
                    id: '123',
                    type: 'LINE',
                    x1: -115.9406,
                    y1: 75.1218,
                    z1: 0,
                    x2: -86.8468,
                    y2: 75.1218,
                    z2: 0,
                },
                // {
                //     id: '126',
                //     type: 'ARC',
                //     x: 0,
                //     y: 0,
                //     z: 0,
                //     R: 50,
                //     fi_start: 30,
                //     fi_end: 60,
                // }
                {
                    id: 'axis2',
                    type: 'LINE',
                    x1: 115.8555,
                    y1: -51,
                    z1: 0,
                    x2: -115.9406,
                    y2: -51,
                    z2: 0,
                },
            ],
            axisId: 'axis2'
        };
        // const axis2 = {
        //     primitives: [
        //     ]
        // };
        const neutral = {
            primitives: [
                {
                    id: '123',
                    type: 'LINE',
                    x1: -75.9808,
                    y1: 58.3013,
                    z1: 0,
                    x2: -50.9808,
                    y2: 15,
                    z2: 0,
                },
                {
                    id: '124',
                    type: 'ARC',
                    x: -25,
                    y: 30,
                    z: 0,
                    R: 30,
                    fi_start: 210,
                    fi_end: 270,
                },
                {
                    id: '123',
                    type: 'LINE',
                    x1: -25,
                    y1: 0,
                    z1: 0,
                    x2: 25,
                    y2: 0,
                    z2: 0,
                },
                {
                    id: '124',
                    type: 'ARC',
                    x: 25,
                    y: 30,
                    z: 0,
                    R: 30,
                    fi_start: 270,
                    fi_end: 330,
                },
                {
                    id: '123',
                    type: 'LINE',
                    x1: 50.9808,
                    y1: 15,
                    z1: 0,
                    x2: 75.9808,
                    y2: 58.3013,
                    z2: 0,
                },
            ]
        };
        const profile = {
            primitives: [
                {
                    id: '123',
                    type: 'LINE',
                    x1: -75.1147,
                    y1: 58.8013,
                    z1: 0,
                    x2: -50.1147,
                    y2: 15.5,
                    z2: 0,
                },
                {
                    id: '124',
                    type: 'ARC',
                    x: -25,
                    y: 30,
                    z: 0,
                    R: 29,
                    fi_start: 210,
                    fi_end: 270,
                },
                {
                    id: '123',
                    type: 'LINE',
                    x1: -25,
                    y1: 1,
                    z1: 0,
                    x2: 25,
                    y2: 1,
                    z2: 0,
                },
                {
                    id: '124',
                    type: 'ARC',
                    x: 25,
                    y: 30,
                    z: 0,
                    R: 29,
                    fi_start: 270,
                    fi_end: 330,
                },
                {
                    id: '123',
                    type: 'LINE',
                    x1: 50.1147,
                    y1: 15.5,
                    z1: 0,
                    x2: 75.1147,
                    y2: 58.8013,
                    z2: 0,
                },
                //////////////////
                {
                    id: '123',
                    type: 'LINE',
                    x1: -76.8468,
                    y1: 57.8013,
                    z1: 0,
                    x2: -51.8468,
                    y2: 14.5,
                    z2: 0,
                },
                {
                    id: '124',
                    type: 'ARC',
                    x: -25,
                    y: 30,
                    z: 0,
                    R: 31,
                    fi_start: 210,
                    fi_end: 270,
                },
                {
                    id: '123',
                    type: 'LINE',
                    x1: -25,
                    y1: -1,
                    z1: 0,
                    x2: 25,
                    y2: -1,
                    z2: 0,
                },
                {
                    id: '124',
                    type: 'ARC',
                    x: 25,
                    y: 30,
                    z: 0,
                    R: 31,
                    fi_start: 270,
                    fi_end: 330,
                },
                {
                    id: '123',
                    type: 'LINE',
                    x1: 51.8468,
                    y1: 14.5,
                    z1: 0,
                    x2: 76.8468,
                    y2: 57.8013,
                    z2: 0,
                },
        
                ////////////
                {
                    id: '123',
                    type: 'LINE',
                    x1: -76.8468,
                    y1: 57.8013,
                    z1: 0,
                    x2: -75.1147,
                    y2: 58.8013,
                    z2: 0,
                },
                {
                    id: '123',
                    type: 'LINE',
                    x1: 76.8468,
                    y1: 57.8013,
                    z1: 0,
                    x2: 75.1147,
                    y2: 58.8013,
                    z2: 0,
                },
        
            ]
        };
        
        const exchangeData = {
            sections: [
                {
                    neutralPolyline: neutral,
                    profileSections: profile,
                    rollers: [roller1, roller2],
                }
            ]
        };
        
        return exchangeData;
    }
}
