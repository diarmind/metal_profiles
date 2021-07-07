import React from 'react';
import cn from 'classnames';

import './Controller.scss';


export default class Controller extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            mini: true,

            zDiff: 0,
            arcApproximationCount: 0,
            lineApproximationCount: 0,
            additionalRenderingStages: 0,
            showProfileAnimationLength: 0,

            changed: false,
        }
    }

    componentDidMount() {
        const {
            zDiff,
            arcApproximationCount,
            lineApproximationCount,
            additionalRenderingStages,
            showProfileAnimationLength
        } = this.props;
        this.setState({
            zDiff: zDiff,
            arcApproximationCount: arcApproximationCount,
            lineApproximationCount: lineApproximationCount,
            additionalRenderingStages: additionalRenderingStages,
            showProfileAnimationLength: showProfileAnimationLength,
        });
    }

    /**
     * Saving edited profile and rendering parameters.
     */
    onSave = () => {
        const {
            zDiff,
            arcApproximationCount,
            lineApproximationCount,
            additionalRenderingStages,
            showProfileAnimationLength
        } = this.state;
        const {
            onZDiffSave,
            onArcApproximationCountSave,
            onLineApproximationCountSave,
            onAdditionalRenderingStagesSave,
            onShowProfileAnimationLengthSave,
        } = this.props;

        onZDiffSave(zDiff);
        onArcApproximationCountSave(arcApproximationCount);
        onLineApproximationCountSave(lineApproximationCount);
        onAdditionalRenderingStagesSave(additionalRenderingStages);
        onShowProfileAnimationLengthSave(showProfileAnimationLength);

        const {onSave} = this.props;
        onSave();
    };

    /**
     * On change distance between main sections event callback.
     * @param {Event} e - event from input.
     */
    onZDiffChange = (e) => {
        const value = e.target.value;
        this.setState({
            zDiff: value,
            changed: true,
        });
    };

    /**
     * Correct zDiff due to physical restrictions.
     * @param {Event} e - event from input.
     */
    onZDiffBlur = (e) => {
        const defaultZDiff = 10;
        let value = Number(e.target.value);
        if (isNaN(value) || value === Infinity || value === -Infinity || value <= 0) {
            value = defaultZDiff;
        }
        this.setState({
            zDiff: value,
        });
    };

    /**
     * On change line count to approximate one arc.
     * @param {Event} e - event from input.
     */
    onArcApproximationCountChange = (e) => {
        const value = e.target.value;
        this.setState({
            arcApproximationCount: value,
            changed: true,
        });
    };

    /**
     * Correct line count to approximate one arc.
     * @param {Event} e - event from input.
     */
    onArcApproximationCountBlur = (e) => {
        const defaultArcApproximationCount = 4;
        const maxArcApproximationCount = 10;
        let value = parseInt(e.target.value);
        if (
            isNaN(value) ||
            value === Infinity ||
            value === -Infinity ||
            value <= 0 ||
            value > maxArcApproximationCount
        ) {
            value = defaultArcApproximationCount;
        }
        this.setState({
            arcApproximationCount: value,
        });
    };

    /**
     * On change line count to divide one line to.
     * @param {Event} e - event from input.
     */
    onLineApproximationCountChange = (e) => {
        const value = e.target.value;
        this.setState({
            lineApproximationCount: value,
            changed: true,
        });
    };

    /**
     * Correct line count to divide one line to.
     * @param {Event} e - event from input.
     */
    onLineApproximationCountBlur = (e) => {
        const defaultLineApproximationCount = 4;
        const maxLineApproximationCount = 10;
        let value = parseInt(e.target.value);
        if (
            isNaN(value) ||
            value === Infinity ||
            value === -Infinity ||
            value <= 0 ||
            value > maxLineApproximationCount
        ) {
            value = defaultLineApproximationCount;
        }
        this.setState({
            lineApproximationCount: value,
        });
    };

    /**
     * On change additional rendering stages between two main profiles count.
     * @param {Event} e - event from input.
     */
    onAdditionalRenderingStagesChange = (e) => {
        const value = e.target.value;
        this.setState({
            additionalRenderingStages: value,
            changed: true,
        });
    };

    /**
     * Correct additional rendering stages between two main profiles count.
     * @param {Event} e - event from input.
     */
    onAdditionalRenderingStagesBlur = (e) => {
        const defaultAdditionalRenderingStages = 20;
        const minAdditionalRenderingStages = 10;
        const maxAdditionalRenderingStagesCount = 60;
        let value = parseInt(e.target.value);
        if (
            isNaN(value) ||
            value === Infinity ||
            value === -Infinity ||
            value <= 0 ||
            value > maxAdditionalRenderingStagesCount ||
            value < minAdditionalRenderingStages
        ) {
            value = defaultAdditionalRenderingStages;
        }
        this.setState({
            additionalRenderingStages: value,
        });
    };

    /**
     * On change profile animated part length.
     * @param {Event} e - event from input.
     */
    onShowProfileAnimationLengthChange = (e) => {
        const value = e.target.value;
        this.setState({
            showProfileAnimationLength: value,
            changed: true,
        });
    };

    /**
     * Correct additional rendering stages between two main profiles count.
     * @param {Event} e - event from input.
     */
    onShowProfileAnimationLengthBlur = (e) => {
        const defaultShowProfileAnimationLength = 15;
        let value = parseInt(e.target.value);
        if (
            isNaN(value) ||
            value === Infinity ||
            value === -Infinity ||
            value <= 0
        ) {
            value = defaultShowProfileAnimationLength;
        }
        this.setState({
            showProfileAnimationLength: value,
        });
    };

    /**
     * Show/hide controller menu toggle function.
     */
    onMiniClick = () => {
        const {mini} = this.state;
        this.setState({
            mini: !mini,
        });
    };

    /**
     * Render controls
     * @returns {*}
     */
    render() {
        const {
            mini,
            changed,
            zDiff,
            arcApproximationCount,
            lineApproximationCount,
            additionalRenderingStages,
            showProfileAnimationLength
        } = this.state;
        const {onPlay, onStop, onPause, onUnpause} = this.props;

        return (
            <>
                <button
                    type="button"
                    className={cn({
                        'roller-controls-trigger': true,
                        'roller-controls-trigger_active': !mini,
                        'roller-controls-trigger_inactive': mini,
                    })}
                    onClick={this.onMiniClick}
                />
                {!mini && (
                    <div className="roller-controls">
                        <div className="roller-controls__header">
                            <p className="roller-controls__title">Параметры</p>
                        </div>
                        <div className="roller-controls__input-line">
                            <p className="roller-controls__label">Расстояние между клетями</p>
                            <input
                                type="text"
                                className="roller-controls__input"
                                value={zDiff}
                                onChange={this.onZDiffChange}
                                onBlur={this.onZDiffBlur}
                                title="Расстояние между клетями"
                            />
                        </div>
                        <div className="roller-controls__input-line">
                            <p className="roller-controls__label">Число линий, заменяющих скругление</p>
                            <input
                                type="text"
                                className="roller-controls__input"
                                value={arcApproximationCount}
                                onChange={this.onArcApproximationCountChange}
                                onBlur={this.onArcApproximationCountBlur}
                                title="Число линий, заменяющих скругление"
                            />
                        </div>
                        <div className="roller-controls__input-line">
                            <p className="roller-controls__label">Число дополнительных поперечных делений прямого участка профиля</p>
                            <input
                                type="text"
                                className="roller-controls__input"
                                value={lineApproximationCount}
                                onChange={this.onLineApproximationCountChange}
                                onBlur={this.onLineApproximationCountBlur}
                                title="Число дополнительных поперечных делений прямого участка профиля"
                            />
                        </div>
                        <div className="roller-controls__input-line">
                            <p className="roller-controls__label">Число дополнительных промежуточных профилей между двумя клетями</p>
                            <input
                                type="text"
                                className="roller-controls__input"
                                value={additionalRenderingStages}
                                onChange={this.onAdditionalRenderingStagesChange}
                                onBlur={this.onAdditionalRenderingStagesBlur}
                                title="Число дополнительных промежуточных профилей между двумя клетями"
                            />
                        </div>
                        <div className="roller-controls__input-line">
                            <p className="roller-controls__label">Длина профиля для анимации</p>
                            <input
                                type="text"
                                className="roller-controls__input"
                                value={showProfileAnimationLength}
                                onChange={this.onShowProfileAnimationLengthChange}
                                onBlur={this.onShowProfileAnimationLengthBlur}
                                title="Длина профиля для анимации"
                            />
                        </div>
                        <div className="roller-controls__input-line">
                            <button
                                type="button"
                                className="roller-controls__button"
                                disabled={!changed}
                                onClick={this.onSave}
                            >
                                Применить
                            </button>
                        </div>
                        <div className="roller-controls__input-line">
                            <p className="roller-controls__player-title">Анимация</p>
                            <div className="roller-controls__player">
                                <button
                                    type="button"
                                    className="roller-controls__player-button roller-controls__player-button_play"
                                    onClick={onPlay}
                                    title="Старт"
                                />
                                <button
                                    type="button"
                                    className="roller-controls__player-button roller-controls__player-button_stop"
                                    onClick={onStop}
                                    title="Стоп"
                                />
                                <button
                                    type="button"
                                    className="roller-controls__player-button roller-controls__player-button_pause"
                                    onClick={onPause}
                                    title="Пауза"
                                />
                                <button
                                    type="button"
                                    className="roller-controls__player-button roller-controls__player-button_resume"
                                    onClick={onUnpause}
                                    title="Продолжить"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </>
        )
    }
}
