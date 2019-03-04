import React from 'react'
import styled from 'styled-components'
import Logo from './Logo'

const Content = styled.div`
  color: white;
  text-align: center;
  margin-bottom: auto;
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: center;
`

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;


const TurnPhone = props => {
  return (
    <PageContainer>
      <Logo />
      <Content>Please turn your phone to landscape</Content>
    </PageContainer>
  )
}

TurnPhone.propTypes = {}

export default TurnPhone
