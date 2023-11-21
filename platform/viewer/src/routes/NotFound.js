import React from 'react';
import { Icon } from '@ohif/ui';
import './NotFound.css';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function NotFound({ message = 'Sorry, this page does not exist.', showGoBackButton = true }) {

  const context = useAppContext();

  return (
    <div className={'not-found'}>
      <div>
        {showGoBackButton ? (
          <Icon name="xnat-ohif-logo" className="xnat-logo" />
        ) : (
          <Icon name="xnat-ohif-logo-anim" className="xnat-logo" />
        )}
      </div>
      <div>
        <h4>{message}</h4>
        {/*{showGoBackButton && context.appConfig.showStudyList && (*/}
        {showGoBackButton && (
          <h5>
            <Link to={'/'}>Go back to XNAT</Link>
          </h5>
        )}
      </div>
    </div>
  );
}
