import React from 'react';
import Menu from './components/Menu/Menu.jsx';
import Index from './components/Index/Index.jsx';
import ProfileCreation from './components/ProfileCreation/ProfileCreation.jsx'
import Roller from './components/Roller/Roller.jsx';
import RollerEditor from './components/RollerEditor/RollerEditor.jsx';

import './App.scss';

const converters = {
    'index': val => val + 1
};

const noop = () => {};

export default class App extends React.Component {

    constructor(props, context, updater) {
        super(props, context, updater);

        this.state = {
            active: 'index',
            menuSections: [
                {
                    title: 'Начало работы',
                    path: '',
                    name: 'index',
                    component: Index,
                    dataOut: null,
                },
                {
                    title: 'Создание профиля',
                    path: '',
                    name: 'create_mech_profile',
                    component: ProfileCreation,
                    dataOut: null,
                },
                {
                    title: 'Редактор промежуточных профилей',
                    path: '',
                    name: 'intermediate_mech_profile_editor',
                    dataOut: null,
                    component: RollerEditor,
                },
                {
                    title: 'Построение геометрий сечений листа',
                    path: '',
                    name: 'cross_section_editor',
                    dataOut: null,
                },
                {
                    title: 'Редактор профилей валков',
                    path: '',
                    name: 'shaft_profile_editor',
                    component: Roller,
                    dataOut: null,
                },
                {
                    title: 'Обработка результатов',
                    path: '',
                    name: 'results',
                    dataOut: null,
                },
                {
                    title: 'Обучение',
                    path: '',
                    name: 'tutorial',
                    dataOut: null,
                }
            ]
        };

        this.changeSection = this.changeSection.bind(this);
        this.setOutFabric = this.setOutFabric.bind(this);
        this.getInitialParams = this.getInitialParams.bind(this);
    }

    changeSection(e) {
        const target = e.currentTarget;
        const name = target.getAttribute("data-name");
        this.setState({
            active: name,
        });
    };

    setOutFabric(name) {
        return (out) => {
            const {menuSections} = this.state;
            const stageInd = menuSections.findIndex(section => section.name === name);

            menuSections[stageInd].dataOut = out;
            this.setState({
                menuSections
            });
        }
    }

    getInitialParams(name) {
        const {menuSections} = this.state;
        const stageInd = menuSections.findIndex(section => section.name === name) || 0;
        const prevInd = stageInd - 1;

        if (prevInd >= 0) {
            const prevStage = menuSections[prevInd];
            return (converters[prevStage.name] || noop)(prevStage.dataOut);
        }

        return null;
    }

    render() {
        const {menuSections, active} = this.state;
        const section = menuSections.find(section => section.name === active);
        const Stage = (section || {}).component;

        return (
            <div className="root">
                <Menu menuSections={menuSections} active={active} changeSection={this.changeSection} />
                <div className="action-screen">
                    {active && Stage && (
                        <Stage
                            savedOut={section.dataOut}
                            dataIn={this.getInitialParams(section.name)}
                            setOut={this.setOutFabric(section.name)}
                        />
                    )}
                </div>
            </div>
        )
    }
}