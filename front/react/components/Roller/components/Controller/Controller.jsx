import React from 'react';

import './Controller.scss';


export default class Controller extends React.Component {

    /**
     * Render controls
     * @returns {*}
     */
    render() {
        return (
            <div className="roller-controls">
                <div className="roller-controls__input-line">
                    <p className="roller-controls__label">Начальное расстояние</p>
                    <input type="number" className="roller-controls__input"/>
                </div>
            </div>
        )
    }
}
