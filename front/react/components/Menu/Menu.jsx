import React from 'react';
import cn from 'classnames';
import "./Menu.scss";

export default class Menu extends React.Component {

    render() {
        const {menuSections, active, changeSection} = this.props;

        return (
            <React.Fragment>
                <div className="menu">
                    <div className="menu__header"/>
                    <div className="menu__section-container">
                        <div className="menu__hr"/>
                        {menuSections.map((section, i) => {
                            return (
                                <React.Fragment key={i}>
                                    <div
                                         className={cn("menu__section", {"menu__section_active": active === section.name})}
                                         data-name={section.name}
                                         onClick={changeSection}
                                    >
                                        {section.title}
                                    </div>
                                    <div className="menu__hr"/>
                                </React.Fragment>
                            )
                        })}
                    </div>
                </div>
            </React.Fragment>
        )
    }
}