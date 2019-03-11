import React from 'react'
import styled from 'styled-components'
import Logo from './Logo'
import turnPhone from '../images/turnPhone.gif'

const Content = styled.div`
  color: white;
  text-align: center;
  margin-bottom: auto;
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const GIF = styled.img`
  width: 100vw;
  height: auto;
  margin-bottom: -80px;
  margin-top: -200px;
`;

const TurnPhone = props => {
  return (
    <PageContainer>
      <Logo />
      <Content>
        <GIF src={turnPhone} />
        <div>
          Please turn your phone to landscape
        </div>
      </Content>
    </PageContainer>
  )
}

TurnPhone.propTypes = {}

export default TurnPhone
