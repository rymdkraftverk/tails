import React from 'react'
import styled from 'styled-components'
import LogoImg from '../images/logo.png'

const Container = styled.div`
  display: flex;
  margin-top: 32px;
`

const Img = styled.img`
  height: 20vw;
  width: auto;
`

const Title = styled.p`
  color: white;
  font-size: 5vw;
  margin-top: 3vw;
`

const Logo = () => {
  return (
    <Container>
      <Img src={LogoImg} alt="Logo" />
      <Title>tails</Title>
    </Container>
  )
}

export default Logo
